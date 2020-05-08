import * as faker from 'faker';
import { mapValues } from 'lodash';

type SequenceFunction = (counter: number) => unknown;

interface SequenceGenerator {
  generatorType: 'sequence';
  userProvidedFunction: SequenceFunction;
  call: (userProvidedFunction: SequenceFunction, counter: number) => unknown;
}

interface FakerGenerator {
  generatorType: 'faker';
  call: (fake: Faker.FakerStatic) => any;
}

interface PerBuildGenerator {
  generatorType: 'perBuild';
  func: () => any;
  call: (f: () => any) => any;
}

interface OneOfGenerator {
  generatorType: 'oneOf';
  options: any[];
  call: <T>(options: T[]) => T;
}

type FieldGenerator =
  | FakerGenerator
  | SequenceGenerator
  | OneOfGenerator
  | PerBuildGenerator;

type Field =
  | string
  | number
  | null
  | FieldGenerator
  | { [x: string]: Field | {} }
  | any[];

type FieldsConfiguration<FactoryResultType> = {
  readonly [x in keyof FactoryResultType]: Field;
};

interface Overrides<FactoryResultType> {
  [x: string]: Field;
}

interface BuildTimeConfig<FactoryResultType> {
  overrides?: Overrides<FactoryResultType>;
  map?: (builtThing: FactoryResultType) => FactoryResultType;
}

interface BuildConfiguration<FactoryResultType> {
  readonly fields: FieldsConfiguration<FactoryResultType>;
  readonly postBuild?: (x: FactoryResultType) => FactoryResultType;
}

const isGenerator = (field: Field): field is FieldGenerator => {
  if (!field) return false;

  return (field as FieldGenerator).generatorType !== undefined;
};

type ValueOf<T> = T[keyof T];

const identity = <T>(x: T): T => x;

export const build = <FactoryResultType>(
  factoryNameOrConfig: string | BuildConfiguration<FactoryResultType>,
  configObject?: BuildConfiguration<FactoryResultType>
): ((
  buildTimeConfig?: BuildTimeConfig<FactoryResultType>
) => FactoryResultType) => {
  const config = (typeof factoryNameOrConfig === 'string'
    ? configObject
    : factoryNameOrConfig) as BuildConfiguration<FactoryResultType>;

  let sequenceCounter = 0;

  const expandConfigFields = (
    fields: FieldsConfiguration<FactoryResultType>,
    buildTimeConfig: BuildTimeConfig<FactoryResultType> = {}
  ): { [P in keyof FieldsConfiguration<FactoryResultType>]: any } => {
    const finalBuiltThing = mapValues(fields, (fieldValue, fieldKey) => {
      const overrides = buildTimeConfig.overrides || {};

      const valueOrOverride = overrides[fieldKey] || fieldValue;

      /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
      return expandConfigField(valueOrOverride);
    });

    return finalBuiltThing;
  };

  const expandConfigField = (
    fieldValue: ValueOf<FieldsConfiguration<FactoryResultType>>
  ): any => {
    let calculatedValue;

    if (isGenerator(fieldValue)) {
      switch (fieldValue.generatorType) {
        case 'sequence': {
          ++sequenceCounter;
          calculatedValue = fieldValue.call(
            fieldValue.userProvidedFunction,
            sequenceCounter
          );
          break;
        }

        case 'faker': {
          calculatedValue = fieldValue.call(faker);
          break;
        }

        case 'oneOf': {
          calculatedValue = fieldValue.call(fieldValue.options);
          break;
        }

        case 'perBuild': {
          calculatedValue = fieldValue.call(fieldValue.func);
          break;
        }
      }
    } else if (Array.isArray(fieldValue)) {
      calculatedValue = fieldValue.map((v) => expandConfigField(v));
      return calculatedValue;
    } else if (fieldValue === null || fieldValue === undefined) {
      // has to be before typeof fieldValue === 'object'
      // as typeof null === 'object'
      calculatedValue = fieldValue;
    } else if (typeof fieldValue === 'object') {
      const nestedFieldsObject = fieldValue as FieldsConfiguration<
        FactoryResultType
      >;

      calculatedValue = expandConfigFields(nestedFieldsObject);
    } else {
      calculatedValue = fieldValue;
    }

    return calculatedValue;
  };

  return (buildTimeConfig = {}) => {
    const fieldsToReturn = expandConfigFields(config.fields, buildTimeConfig);
    const postBuild = config.postBuild || identity;
    const buildTimeMapFunc = buildTimeConfig.map || identity;

    return buildTimeMapFunc(postBuild(fieldsToReturn));
  };
};

export const oneOf = <T>(...options: T[]): OneOfGenerator => {
  return {
    generatorType: 'oneOf',
    options,
    call: <T>(options: T[]): T => {
      const randomIndex = Math.floor(Math.random() * options.length);

      return options[randomIndex];
    },
  };
};

export const bool = (): OneOfGenerator => oneOf(true, false);

export const sequence = (
  userProvidedFunction: SequenceFunction = (x) => x
): SequenceGenerator => {
  return {
    generatorType: 'sequence',
    userProvidedFunction,
    call: (userProvidedFunction: SequenceFunction, counter: number) => {
      return userProvidedFunction(counter);
    },
  };
};

export const perBuild = <T>(func: () => T): PerBuildGenerator => {
  return {
    generatorType: 'perBuild',
    func,
    call: (f: () => T): T => {
      return f();
    },
  };
};

type FakerUserArgs = (fake: Faker.FakerStatic) => any;

export const fake = (userDefinedUsage: FakerUserArgs): FakerGenerator => {
  return {
    generatorType: 'faker',
    call: (faker) => {
      return userDefinedUsage(faker);
    },
  };
};

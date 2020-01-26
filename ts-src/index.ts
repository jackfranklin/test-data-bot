import * as faker from 'faker';
import { mapValues } from 'lodash';

interface SequenceGenerator {
  generatorType: 'sequence';
  call: (counter: number) => number;
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
  | FieldGenerator
  | { [x: string]: Field | {} }
  | any[];

type FieldsConfiguration<FactoryResultType> = {
  readonly [x in keyof FactoryResultType]: Field
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
}

const isGenerator = (field: Field): field is FieldGenerator => {
  return (field as FieldGenerator).generatorType !== undefined;
};

type ValueOf<T> = T[keyof T];

export const build = <FactoryResultType>(
  factoryName: string,
  config: BuildConfiguration<FactoryResultType>
): ((
  buildTimeConfig?: BuildTimeConfig<FactoryResultType>
) => FactoryResultType) => {
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

    const mapFunc = buildTimeConfig.map || (x => x);
    return mapFunc(finalBuiltThing);
  };

  const expandConfigField = (
    fieldValue: ValueOf<FieldsConfiguration<FactoryResultType>>
  ): any => {
    let calculatedValue;

    if (isGenerator(fieldValue)) {
      switch (fieldValue.generatorType) {
        case 'sequence': {
          ++sequenceCounter;
          calculatedValue = fieldValue.call(sequenceCounter);
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
      calculatedValue = fieldValue.map(v => expandConfigField(v));
      return calculatedValue;
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
    return fieldsToReturn;
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

export const sequence = (): SequenceGenerator => {
  return {
    generatorType: 'sequence',
    call: (counter: number) => {
      return counter;
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
    call: faker => {
      return userDefinedUsage(faker);
    },
  };
};

import { mapValues } from 'lodash';

export type SequenceFunction = (counter: number) => unknown;

export interface SequenceGenerator {
  generatorType: 'sequence';
  userProvidedFunction: SequenceFunction;
  call: (userProvidedFunction: SequenceFunction, counter: number) => unknown;
}

export interface PerBuildGenerator {
  generatorType: 'perBuild';
  func: () => any;
  call: (f: () => any) => any;
}

export interface OneOfGenerator {
  generatorType: 'oneOf';
  options: any[];
  call: <T>(options: T[]) => T;
}

export type FieldGenerator =
  | SequenceGenerator
  | OneOfGenerator
  | PerBuildGenerator;

export type Field<T = any> = T | FieldGenerator | FieldsConfiguration<T>;

export type FieldsConfiguration<FactoryResultType> = {
  readonly [Key in keyof FactoryResultType]: Field<FactoryResultType[Key]>;
};

export type Overrides<FactoryResultType = any> = {
  [Key in keyof FactoryResultType]?: Field<FactoryResultType[Key]>;
};

export interface BuildTimeConfig<FactoryResultType> {
  overrides?: Overrides<FactoryResultType>;
  map?: (builtThing: FactoryResultType) => FactoryResultType;
  traits?: string | string[];
}

export interface TraitsConfiguration<FactoryResultType> {
  readonly [traitName: string]: {
    overrides?: Overrides<FactoryResultType>;
    postBuild?: (builtThing: FactoryResultType) => FactoryResultType;
  };
}

export interface BuildConfiguration<FactoryResultType> {
  readonly fields: FieldsConfiguration<FactoryResultType>;
  readonly traits?: TraitsConfiguration<FactoryResultType>;
  readonly postBuild?: (x: FactoryResultType) => FactoryResultType;
}

const isGenerator = (field: Field): field is FieldGenerator => {
  if (!field) return false;

  return (field as FieldGenerator).generatorType !== undefined;
};

export type ValueOf<T> = T[keyof T];

const identity = <T>(x: T): T => x;

const buildTimeTraitsArray = <FactoryResultType>(
  buildTimeConfig: BuildTimeConfig<FactoryResultType>
): string[] => {
  const { traits = [] } = buildTimeConfig;
  return Array.isArray(traits) ? traits : [traits];
};

const getValueOrOverride = (
  overrides: Overrides,
  traitOverrides: Overrides,
  fieldValue: Field,
  fieldKey: string
): Field => {
  if (Object.keys(overrides).includes(fieldKey)) {
    return overrides[fieldKey];
  }

  if (Object.keys(traitOverrides).includes(fieldKey)) {
    return traitOverrides[fieldKey];
  }

  return fieldValue;
};

export const build = <FactoryResultType>(
  factoryNameOrConfig: string | BuildConfiguration<FactoryResultType>,
  configObject?: BuildConfiguration<FactoryResultType>
): ((
  buildTimeConfig?: BuildTimeConfig<FactoryResultType>
) => FactoryResultType) => {
  const config = (
    typeof factoryNameOrConfig === 'string' ? configObject : factoryNameOrConfig
  ) as BuildConfiguration<FactoryResultType>;

  let sequenceCounter = 0;

  const expandConfigFields = (
    fields: FieldsConfiguration<FactoryResultType>,
    buildTimeConfig: BuildTimeConfig<FactoryResultType> = {}
  ): { [P in keyof FieldsConfiguration<FactoryResultType>]: any } => {
    const finalBuiltThing = mapValues(fields, (fieldValue, fieldKey) => {
      const overrides = buildTimeConfig.overrides || {};

      const traitsArray = buildTimeTraitsArray(buildTimeConfig);

      const traitOverrides = traitsArray.reduce<Overrides<FactoryResultType>>(
        (overrides, currentTraitKey) => {
          const hasTrait = config.traits && config.traits[currentTraitKey];
          if (!hasTrait) {
            console.warn(`Warning: trait '${currentTraitKey}' not found.`);
          }
          const traitsConfig = config.traits
            ? config.traits[currentTraitKey]
            : {};
          return { ...overrides, ...(traitsConfig.overrides || {}) };
        },
        {}
      );

      const valueOrOverride = getValueOrOverride(
        overrides,
        traitOverrides,
        fieldValue,
        fieldKey
      );

      /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
      return expandConfigField(valueOrOverride);
    });

    return finalBuiltThing;
  };

  const expandConfigField = (fieldValue: Field): any => {
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
      calculatedValue = expandConfigFields(fieldValue);
    } else {
      calculatedValue = fieldValue;
    }

    return calculatedValue;
  };

  return (buildTimeConfig = {}) => {
    const fieldsToReturn = expandConfigFields(config.fields, buildTimeConfig);

    const traitsArray = buildTimeTraitsArray(buildTimeConfig);
    const traitPostBuilds = traitsArray.map((traitName) => {
      const traitConfig = (config.traits && config.traits[traitName]) || {};
      const postBuild = traitConfig.postBuild || identity;
      return postBuild;
    });

    const afterTraitPostBuildFields = traitPostBuilds.reduce(
      (fields, traitPostBuild) => {
        return traitPostBuild(fields);
      },
      fieldsToReturn
    );
    const postBuild = config.postBuild || identity;
    const buildTimeMapFunc = buildTimeConfig.map || identity;

    return buildTimeMapFunc(postBuild(afterTraitPostBuildFields));
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

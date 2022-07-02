export interface SequenceGenerator<T> {
  generatorType: 'sequence';
  call: (counter: number) => T;
}

export interface PerBuildGenerator<T> {
  generatorType: 'perBuild';
  call: () => T;
}

export interface OneOfGenerator<T> {
  generatorType: 'oneOf';
  call: () => T;
}

export type FieldGenerator<T> =
  | SequenceGenerator<T>
  | OneOfGenerator<T>
  | PerBuildGenerator<T>;

export type Field<T = any> = T | FieldGenerator<T> | FieldsConfiguration<T>;

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

const isGenerator = (field: Field): field is FieldGenerator<any> => {
  if (!field) return false;

  return (field as FieldGenerator<any>).generatorType !== undefined;
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

function mapValues<InputObject, Key extends keyof InputObject>(
  object: InputObject,
  callback: (value: InputObject[Key], key: Key) => unknown
) {
  return (Object.keys(object) as Key[]).reduce((total, key) => {
    total[key] = callback(object[key], key);
    return total;
  }, {} as { [key in Key]: unknown });
}

export const build = <FactoryResultType>(
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
        fieldKey as string
      );

      /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
      return expandConfigField(valueOrOverride);
    });

    return finalBuiltThing;
  };

  const expandConfigField = (fieldValue: Field): Field => {
    if (isGenerator(fieldValue)) {
      switch (fieldValue.generatorType) {
        case 'sequence': {
          return fieldValue.call(++sequenceCounter);
        }

        case 'oneOf':
        case 'perBuild': {
          return fieldValue.call();
        }
      }
    }

    if (Array.isArray(fieldValue)) {
      return fieldValue.map((v) => expandConfigField(v));
    }

    if (fieldValue === null || fieldValue === undefined) {
      // has to be before typeof fieldValue === 'object'
      // as typeof null === 'object'
      return fieldValue;
    }

    if (typeof fieldValue === 'object') {
      return expandConfigFields(fieldValue);
    }

    return fieldValue;
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

export const oneOf = <T>(...options: T[]): OneOfGenerator<T> => {
  return {
    generatorType: 'oneOf',
    call: (): T => {
      const randomIndex = Math.floor(Math.random() * options.length);

      return options[randomIndex];
    },
  };
};

export const bool = () => oneOf(true, false);

type Sequence = {
  (): SequenceGenerator<number>;
  <T>(userProvidedFunction: (count: number) => T): SequenceGenerator<T>;
};

export const sequence = ((userProvidedFunction) => {
  return {
    generatorType: 'sequence',
    call: (counter: number) => {
      if (typeof userProvidedFunction === 'undefined') {
        return counter;
      }
      return userProvidedFunction(counter);
    },
  };
}) as Sequence;

export const perBuild = <T>(func: () => T): PerBuildGenerator<T> => {
  return {
    generatorType: 'perBuild',
    call: () => {
      return func();
    },
  };
};

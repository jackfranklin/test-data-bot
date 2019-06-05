import * as faker from 'faker';

interface SequenceGenerator {
  generatorType: 'sequence';
  call: (counter: number) => number;
}

interface FakerGenerator {
  generatorType: 'faker';
  call: (fake: Faker.FakerStatic) => any;
}

type FieldGenerator = FakerGenerator | SequenceGenerator;
type Field = string | number | FieldGenerator;

interface BuildConfiguration<FactoryResultType> {
  readonly fields: { readonly [x in keyof FactoryResultType]: Field };
}

const isGenerator = (field: Field): field is FieldGenerator => {
  return (field as FieldGenerator).generatorType !== undefined;
};

export const build = <FactoryResultType>(
  factoryName: string,
  config: BuildConfiguration<FactoryResultType>
): (() => FactoryResultType) => {
  let sequenceCounter = 0;

  return () => {
    const fieldsToReturn = Object.entries<Field>(config.fields).reduce<
      FactoryResultType
    >(
      (fieldsAccumulator, currentField) => {
        const [fieldName, fieldValue] = currentField;

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
          }
        } else {
          calculatedValue = fieldValue;
        }

        return {
          ...fieldsAccumulator,
          [fieldName]: calculatedValue,
        };
      },
      {} as FactoryResultType
    );

    return fieldsToReturn;
  };
};

export const sequence = (): SequenceGenerator => {
  return {
    generatorType: 'sequence',
    call: (counter: number) => {
      return counter;
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

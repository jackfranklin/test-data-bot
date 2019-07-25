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

type FieldGenerator = FakerGenerator | SequenceGenerator;
type Field = string | number | FieldGenerator;

type FieldsConfiguration<FactoryResultType> = {
  readonly [x in keyof FactoryResultType]: Field
};

interface BuildConfiguration<FactoryResultType> {
  readonly fields: FieldsConfiguration<FactoryResultType>;
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
    const fieldsToReturn = mapValues(config.fields, fieldValue => {
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

      return calculatedValue;
    });

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

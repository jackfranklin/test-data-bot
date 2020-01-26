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

interface OneOfGenerator {
  generatorType: 'oneOf';
  options: any[];
  call: <T>(options: T[]) => T;
}

type FieldGenerator = FakerGenerator | SequenceGenerator | OneOfGenerator;

type Field = string | number | FieldGenerator | { [x: string]: Field };

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

  const expandConfigFields = (
    fields: FieldsConfiguration<FactoryResultType>
  ): { [P in keyof FieldsConfiguration<FactoryResultType>]: any } => {
    return mapValues(fields, fieldValue => {
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
          }
        }
      } else if (typeof fieldValue === 'object') {
        const nestedFieldsObject = fieldValue as FieldsConfiguration<
          FactoryResultType
        >;

        calculatedValue = expandConfigFields(nestedFieldsObject);
      } else {
        calculatedValue = fieldValue;
      }

      return calculatedValue;
    });
  };

  return () => {
    const fieldsToReturn = expandConfigFields(config.fields);
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

type FakerUserArgs = (fake: Faker.FakerStatic) => any;

export const fake = (userDefinedUsage: FakerUserArgs): FakerGenerator => {
  return {
    generatorType: 'faker',
    call: faker => {
      return userDefinedUsage(faker);
    },
  };
};

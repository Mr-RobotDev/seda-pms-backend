import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Field, FieldValues } from '../../common/enums/field.enum';

@ValidatorConstraint({ async: false })
class IsFieldConstraint implements ValidatorConstraintInterface {
  validate(fields: any) {
    if (typeof fields !== 'string') return false;
    const fieldArray = fields.split(',').map((field) => field.trim());
    return fieldArray.every((field) => FieldValues.includes(field as Field));
  }

  defaultMessage() {
    return `Field must be a single value or a comma-separated string of values: ${Object.values(Field).join(', ')}`;
  }
}

export function IsField(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFieldConstraint,
    });
  };
}

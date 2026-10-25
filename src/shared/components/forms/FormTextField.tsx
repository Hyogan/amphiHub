import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { TextField, type TextFieldProps } from './TextField';

/** A TextField wired to React Hook Form. The form value is always a string here. */
export function FormTextField<T extends FieldValues>({
  control,
  name,
  ...props
}: { control: Control<T>; name: Path<T> } & Omit<TextFieldProps, 'value' | 'onChangeText' | 'onBlur' | 'error'>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          value={String(field.value ?? '')}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

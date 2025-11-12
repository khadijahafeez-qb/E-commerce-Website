'use client';

import { FieldErrors, UseFormRegister, Path } from 'react-hook-form';

type FormValue = string | number | boolean | null;
type FormValues = Record<string, FormValue>;

export type Field<T extends FormValues> = {
  name: Path<T>;
  type: string;
  placeholder: string;
  label?: string;
  required?: boolean
};

type AuthFormProps<T extends FormValues> = {
  heading: string;
  fields: Field<T>[];
  buttonLabel: string;
  buttonType?: 'submit';
  disabled?: boolean;
  footer?: React.ReactNode;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  children?: React.ReactNode;
};

export default function AuthForm<T extends FormValues>({
  heading,
  fields,
  buttonLabel,
  buttonType = 'submit',
  disabled,
  footer,
  onSubmit,
  register,
  errors,
  children,
}: AuthFormProps<T>) {
  return (
    <>
      <h2 className="font-inter font-medium text-[#007BFF] mb-[45px] !text-[32px] text-center leading-[38px]">
        {heading}
      </h2>
      <div className="bg-white px-8 pt-8 pb-8 shadow-lg rounded-lg">
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          {fields.map((field) => (
            <div key={field.name} className="flex flex-col gap-2">
              {field.label && (
                <label
                  htmlFor={field.name}
                  className="font-inter font-medium text-[#212529] leading-[100%]"
                >
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                  {field.label}

                </label>
              )}
              <input
                {...register(field.name)}
                id={field.name}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                className="border border-[#CED4DA] py-2 px-2 rounded font-inter font-medium leading-[24px] !text-[#6C757D]"
              />
              {errors?.[field.name] && (
                <p className="text-red-500 text-sm">
                  {String(errors[field.name]?.message)}
                </p>
              )}
            </div>
          ))}
          {children}
          <button
            type={buttonType}
            disabled={disabled}
            className={`bg-blue-500 text-white p-2 rounded mt-8 ${disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {buttonLabel}
          </button>
        </form>
        {footer && <div className="font-inter text-center font-normal">{footer}</div>}
      </div>
    </>
  );
}

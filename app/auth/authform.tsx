'use client';

type Field = {
  name: string;
  type: string;
  placeholder: string;
  label?: string;
};
type FormValue = string | number | boolean | null;
type FormValues = Record<string, FormValue>;
type AuthFormProps<T extends FormValues = FormValues> = {
  heading: string;
  fields: Field[];
  buttonLabel: string;        
  buttonType?:'submit';
  disabled?: boolean;                    
  footer?: React.ReactNode;
  onSubmit?: (values: T) => Promise<void> | void;
  errors?: Record<string, string>; 
  children?: React.ReactNode;
};

const AuthForm = <T extends FormValues = FormValues>({ heading, fields, buttonLabel, buttonType='submit', disabled, footer, onSubmit, errors, children }: AuthFormProps<T>) => {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values = Object.fromEntries(fd.entries()) as T;
    if (onSubmit) {
      await onSubmit(values);
    } 
  };
  return (
    <>
      <h2 className=' font-inter font-medium text-[#007BFF] mb-[45px] !text-[32px] text-center leading-[38px]'>{heading}</h2>
      <div className='bg-white px-8 pt-8 pb-8 shadow-lg rounded-lg'>
        <form  onSubmit={handleSubmit} className='flex flex-col gap-6 '>
          {fields.map((field) => (
            <div key={field.name} className='flex flex-col gap-2 '>
              {field.label && (
                <label
                  htmlFor={field.name}
                  className='font-inter font-medium text-[#212529] leading-[100%]'
                >
                  {field.label}
                </label>
              )}
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                className='border border-[#CED4DA] py-2 px-2 rounded font-inter font-medium leading-[24px] !text-[#6C757D]'
              />
              {errors?.[field.name] && (
                <p className='text-red-500 text-sm'>{errors[field.name]}</p>
              )}
            </div>
          ))}

          {children}
           <button
            type={buttonType}
            disabled={disabled}
            className={`bg-blue-500 text-white p-2 rounded mt-8 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            { buttonLabel}
          </button>
        </form>

        {footer && <div className='font-inter text-center font-normal'>{footer}</div>}
      </div>
    </>
  );
};
export default AuthForm;

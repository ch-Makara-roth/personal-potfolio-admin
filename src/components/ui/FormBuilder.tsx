import React, { useMemo, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

type CommonFieldProps<TValues> = {
  name: keyof TValues & string;
  label: string;
  helpText?: string;
  section?: string;
  required?: boolean;
  placeholder?: string;
  validate?: (value: any, values: TValues) => string | undefined;
};

export type FormField<TValues> =
  | (CommonFieldProps<TValues> & {
      type: 'text' | 'url';
      maxLength?: number;
    })
  | (CommonFieldProps<TValues> & {
      type: 'textarea';
      rows?: number;
      maxLength?: number;
    })
  | (CommonFieldProps<TValues> & {
      type: 'select';
      options: Array<{ label: string; value: string }>;
    })
  | (CommonFieldProps<TValues> & {
      type: 'checkbox';
    })
  | (CommonFieldProps<TValues> & {
      type: 'chip-list';
      addLabel?: string;
      minItems?: number;
    })
  | (CommonFieldProps<TValues> & {
      type: 'list';
      itemPlaceholder?: string;
      itemType?: 'text' | 'url';
      addLabel?: string;
    });

export interface FormBuilderProps<TValues extends Record<string, any>> {
  fields: Array<FormField<TValues>>;
  initialValues: TValues;
  submitting?: boolean;
  onSubmit: (values: TValues) => void;
  onCancel?: () => void;
  className?: string;
  submitLabel?: string;
  title?: string;
  description?: string;
}

export function FormBuilder<TValues extends Record<string, any>>({
  fields,
  initialValues,
  submitting = false,
  onSubmit,
  onCancel,
  className,
  submitLabel = 'Save',
  title,
  description,
}: FormBuilderProps<TValues>) {
  const [values, setValues] = useState<TValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [chipInputs, setChipInputs] = useState<Record<string, string>>({});

  const fieldMap = useMemo(() => {
    const m: Record<string, FormField<TValues>> = {};
    fields.forEach((f) => (m[f.name] = f));
    return m;
  }, [fields]);

  const setValue = (name: string, val: any) => {
    setValues((prev) => ({ ...prev, [name]: val }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    fields.forEach((f) => {
      const val = values[f.name];
      if (f.required) {
        if (f.type === 'checkbox') {
          // checkboxes rarely required, skip
        } else if (
          val === undefined ||
          val === null ||
          (typeof val === 'string' && !val.trim()) ||
          (Array.isArray(val) && val.length === 0)
        ) {
          e[f.name] = `${f.label} is required`;
          return;
        }
      }
      if ('maxLength' in f && typeof val === 'string' && f.maxLength) {
        if (val.length > f.maxLength) {
          e[f.name] = `${f.label} must be ${f.maxLength} characters or less`;
          return;
        }
      }
      if (f.type === 'url' && typeof val === 'string' && val) {
        const urlRegex =
          /^(https?:\/\/)[\w.-]+(?:\.[\w.-]+)+[\w\-._~:\/?#\[\]@!$&'()*+,;=.]+$/i;
        if (!urlRegex.test(val)) {
          e[f.name] = 'Invalid URL';
          return;
        }
      }
      if (f.type === 'list' && Array.isArray(val)) {
        (val as string[]).forEach((item: string, i: number) => {
          if (f.itemType === 'url' && item) {
            const urlRegex =
              /^(https?:\/\/)[\w.-]+(?:\.[\w.-]+)+[\w\-._~:\/?#\[\]@!$&'()*+,;=.]+$/i;
            if (!urlRegex.test(item)) {
              e[`${f.name}.${i}`] = 'Invalid URL';
            }
          }
        });
      }
      if (f.type === 'chip-list' && f.minItems) {
        if (!Array.isArray(val) || val.length < f.minItems) {
          e[f.name] = `At least ${f.minItems} item(s) required`;
          return;
        }
      }
      if (f.validate) {
        const msg = f.validate(val, values);
        if (msg) e[f.name] = msg;
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit(values);
  };

  // Group fields by section to create a clearer layout
  const sections = useMemo(() => {
    const order: string[] = [];
    const groups: Record<string, Array<FormField<TValues>>> = {};
    fields.forEach((f) => {
      const s = f.section || 'General';
      if (!groups[s]) {
        groups[s] = [];
        order.push(s);
      }
      groups[s].push(f);
    });
    return order.map((s) => ({ name: s, items: groups[s] }));
  }, [fields]);

  return (
    <Card className={cn('mx-auto max-w-4xl', className)}>
      {(title || description) && (
        <CardHeader className="p-4 md:p-6">
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {sections.map((section) => (
            <div key={section.name} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  {section.name}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.items.map((f) => {
                  const val = values[f.name];
                  switch (f.type) {
                    case 'text':
                    case 'url':
                      return (
                        <div key={f.name} className="md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700">
                            {f.label}
                            {f.required && ' *'}
                          </label>
                          <input
                            type={f.type === 'url' ? 'url' : 'text'}
                            value={val || ''}
                            onChange={(e) => setValue(f.name, e.target.value)}
                            placeholder={f.placeholder}
                            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            maxLength={
                              'maxLength' in f ? f.maxLength : undefined
                            }
                          />
                          {f.helpText && (
                            <p className="mt-1 text-xs text-gray-500">
                              {f.helpText}
                            </p>
                          )}
                          {errors[f.name] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[f.name]}
                            </p>
                          )}
                        </div>
                      );
                    case 'textarea':
                      return (
                        <div key={f.name} className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {f.label}
                            {f.required && ' *'}
                          </label>
                          <textarea
                            value={val || ''}
                            onChange={(e) => setValue(f.name, e.target.value)}
                            rows={f.rows || 3}
                            placeholder={f.placeholder}
                            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            maxLength={
                              'maxLength' in f ? f.maxLength : undefined
                            }
                          />
                          {f.helpText && (
                            <p className="mt-1 text-xs text-gray-500">
                              {f.helpText}
                            </p>
                          )}
                          {'maxLength' in f &&
                          typeof val === 'string' &&
                          f.maxLength ? (
                            <div className="mt-1 text-xs text-gray-500">
                              {(val as string).length}/{f.maxLength}
                            </div>
                          ) : null}
                          {errors[f.name] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[f.name]}
                            </p>
                          )}
                        </div>
                      );
                    case 'select':
                      return (
                        <div key={f.name} className="md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700">
                            {f.label}
                            {f.required && ' *'}
                          </label>
                          <select
                            value={val || ''}
                            onChange={(e) => setValue(f.name, e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            {f.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {f.helpText && (
                            <p className="mt-1 text-xs text-gray-500">
                              {f.helpText}
                            </p>
                          )}
                          {errors[f.name] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[f.name]}
                            </p>
                          )}
                        </div>
                      );
                    case 'checkbox':
                      return (
                        <div
                          key={f.name}
                          className="md:col-span-1 flex items-center"
                        >
                          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={Boolean(val)}
                              onChange={(e) =>
                                setValue(f.name, e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            {f.label}
                          </label>
                          {errors[f.name] && (
                            <p className="ml-2 text-sm text-red-600">
                              {errors[f.name]}
                            </p>
                          )}
                        </div>
                      );
                    case 'chip-list':
                      return (
                        <div key={f.name} className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {f.label}
                            {f.required && ' *'}
                          </label>
                          <div className="mt-2 flex gap-2">
                            <input
                              type="text"
                              value={chipInputs[f.name] || ''}
                              onChange={(e) =>
                                setChipInputs((prev) => ({
                                  ...prev,
                                  [f.name]: e.target.value,
                                }))
                              }
                              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              placeholder={f.placeholder || 'Add item'}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                const v = (chipInputs[f.name] || '').trim();
                                if (!v) return;
                                const arr = Array.isArray(val)
                                  ? (val as string[])
                                  : ([] as string[]);
                                if (arr.includes(v)) return;
                                setValue(f.name, [...arr, v]);
                                setChipInputs((prev) => ({
                                  ...prev,
                                  [f.name]: '',
                                }));
                              }}
                            >
                              {f.addLabel || 'Add'}
                            </Button>
                          </div>
                          {f.helpText && (
                            <p className="mt-1 text-xs text-gray-500">
                              {f.helpText}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(Array.isArray(val)
                              ? (val as string[])
                              : ([] as string[])
                            ).map((t: string) => (
                              <span
                                key={`${f.name}:${t}`}
                                className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-full bg-purple-50 text-purple-700 border border-purple-200"
                              >
                                {t}
                                <button
                                  type="button"
                                  title="Remove"
                                  onClick={() => {
                                    const arr = (
                                      Array.isArray(val)
                                        ? (val as string[])
                                        : ([] as string[])
                                    ).filter((x: string) => x !== t);
                                    setValue(f.name, arr);
                                  }}
                                  className="text-purple-600 hover:text-purple-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          {errors[f.name] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[f.name]}
                            </p>
                          )}
                        </div>
                      );
                    case 'list':
                      return (
                        <div key={f.name} className="md:col-span-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700">
                              {f.label}
                              {f.required && ' *'}
                            </label>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                const arr = Array.isArray(val)
                                  ? (val as string[])
                                  : ([] as string[]);
                                setValue(f.name, [...arr, '']);
                              }}
                            >
                              {f.addLabel || 'Add'}
                            </Button>
                          </div>
                          {f.helpText && (
                            <p className="mt-1 text-xs text-gray-500">
                              {f.helpText}
                            </p>
                          )}
                          <div className="mt-2 space-y-2">
                            {(Array.isArray(val)
                              ? (val as string[])
                              : ([] as string[])
                            ).map((item: string, idx: number) => (
                              <div
                                key={`${f.name}:${idx}`}
                                className="flex gap-2"
                              >
                                <input
                                  type={f.itemType === 'url' ? 'url' : 'text'}
                                  value={item}
                                  onChange={(e) => {
                                    const arr = Array.isArray(val)
                                      ? ([...val] as string[])
                                      : ([] as string[]);
                                    arr[idx] = e.target.value;
                                    setValue(f.name, arr);
                                  }}
                                  placeholder={f.itemPlaceholder}
                                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const arr = Array.isArray(val)
                                      ? ([...val] as string[])
                                      : ([] as string[]);
                                    arr.splice(idx, 1);
                                    setValue(f.name, arr);
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                          {Object.keys(errors).some((k) =>
                            k.startsWith(`${f.name}.`)
                          ) && (
                            <p className="mt-1 text-sm text-red-600">
                              One or more entries are invalid
                            </p>
                          )}
                        </div>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            </div>
          ))}
          <CardFooter className="pt-4 flex items-center justify-end gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : submitLabel}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}

export default FormBuilder;

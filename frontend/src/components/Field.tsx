import React from "react";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({
  label,
  htmlFor,
  error,
  children,
}) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label
        htmlFor={htmlFor}
        className="text-sm font-semibold text-gray-700"
      >
        {label}
      </label>

      {children}

      {error && (
        <span className="text-sm text-red-600 font-medium">{error}</span>
      )}
    </div>
  );
};
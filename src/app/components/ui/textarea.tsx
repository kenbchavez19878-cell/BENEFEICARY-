import * as React from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={`
            flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:cursor-not-allowed disabled:opacity-50
            transition-colors resize-y
            ${error 
              ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }
            ${className}
          `}
          ref={ref}
          {...props}
        />
        {helperText && (
          <p className={`mt-1.5 text-xs ${error ? "text-red-600" : "text-gray-500"}`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };

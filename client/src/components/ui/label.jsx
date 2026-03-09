import React from "react";

export const Label = ({ children, className = "", ...props }) => (
    <label
        className={`text-sm font-medium text-[var(--text-secondary)] mb-1 ${className}`}
        {...props}
    >
        {children}
    </label>
);

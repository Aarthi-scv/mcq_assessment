import React from "react";

export const Select = ({ children, className = "", ...props }) => (
    <select className={`${className}`} {...props}>
        {children}
    </select>
);

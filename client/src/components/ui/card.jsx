import React from "react";

export const Card = ({ children, className = "" }) => (
    <div className={`flex flex-col gap-6 ${className}`}>
        {children}
    </div>
);

export const CardHeader = ({ children, className = "" }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        {children}
    </div>
);

export const CardTitle = ({ children, className = "" }) => (
    <h4 className={`text-xl font-semibold leading-none tracking-tight text-white ${className}`}>
        {children}
    </h4>
);

export const CardDescription = ({ children, className = "" }) => (
    <p className={`text-sm text-[var(--muted-foreground)] ${className}`}>
        {children}
    </p>
);

export const CardContent = ({ children, className = "" }) => (
    <div className={`${className}`}>
        {children}
    </div>
);

export const CardFooter = ({ children, className = "" }) => (
    <div className={`flex items-center pt-6 border-t border-border ${className}`}>
        {children}
    </div>
);

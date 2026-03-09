import React from "react";

export const Button = ({ children, variant = "primary", size = "md", className = "", ...props }) => {
    const variants = {
        primary: "premium-btn-primary shadow-premium",
        outline: "premium-btn-outline",
        ghost: "premium-btn-ghost",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
    };

    const sizes = {
        sm: "h-8 px-3 text-xs",
        md: "h-8 px-4 py-1",
        lg: "h-12 px-8 text-lg"
    };

    return (
        <button
            className={`premium-btn ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

import React, { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

const MultiSelect = ({
    options,
    selected = [],
    onChange,
    placeholder = "Select Batch",
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (option) => {
        const newSelected = selected.includes(option)
            ? selected.filter((item) => item !== option)
            : [...selected, option];
        onChange(newSelected);
    };

    const handleKeyDown = (e, option) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (option === "all") selectAll();
            else toggleOption(option);
        }
    };

    const selectAll = () => {
        if (selected.length === options.length) {
            onChange([]);
        } else {
            onChange([...options]);
        }
    };

    return (
        <div
            className="multi-select-container"
            style={{ zIndex: isOpen ? 2100 : 1 }}
        >
            <div
                className="multi-select-btn"
                onClick={() => setIsOpen(!isOpen)}
                tabIndex="0"
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") && setIsOpen(!isOpen)
                }
            >
                <span>
                    {selected.length > 0 ? `${selected.length} Selected` : placeholder}
                </span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            {isOpen && (
                <>
                    <div
                        className="multi-select-overlay"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="multi-select-dropdown no-scrollbar" role="listbox">
                        <div
                            className="multi-select-option"
                            onClick={selectAll}
                            tabIndex="0"
                            onKeyDown={(e) => handleKeyDown(e, "all")}
                            role="option"
                            aria-selected={selected.length === options.length}
                        >
                            <div
                                className={`custom-checkbox ${selected.length === options.length && options.length > 0 ? "checked" : ""}`}
                            >
                                {selected.length === options.length && options.length > 0 && (
                                    <CheckCircle2 size={14} />
                                )}
                            </div>
                            <label>Select All</label>
                        </div>
                        <div className="multi-select-divider"></div>
                        {options.map((opt) => (
                            <div
                                key={opt}
                                className="multi-select-option"
                                onClick={() => toggleOption(opt)}
                                tabIndex="0"
                                onKeyDown={(e) => handleKeyDown(e, opt)}
                                role="option"
                                aria-selected={selected.includes(opt)}
                            >
                                <div
                                    className={`custom-checkbox ${selected.includes(opt) ? "checked" : ""}`}
                                >
                                    {selected.includes(opt) && <CheckCircle2 size={14} />}
                                </div>
                                <label>{opt}</label>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default MultiSelect;

// src/components/DynamicForm.js
import React from "react";
import "./DynamicForm.css";

function DynamicForm({ fields = [], values, onChange, formDirection = "default", size = "" }) {
  const directions = {
    column: { display: "flex", flexDirection: "column" },
    row: { display: "flex", flexDirection: "row", gap: ".7em" },
    "grid-2": { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2vw" },
    "grid-3": { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2vw" },
    default: { display: "flex", flexDirection: "column" },
  };

  const direction = directions[formDirection] || directions.default;

  return (
    <form className="dynamic-form" style={direction}>
      {fields.map((field, i) => {
        const value = values[field.name] || "";

        return (
          <div key={i} className="dynamic-form--field-container">
            <label className="dynamic-form--field-container--label">
              {field.label}
            </label>

            {field.type === "json" ? (
              <textarea
                name={field.name}
                value={value}
                placeholder={field.placeholder}
                style={{ height: "20vh", fontFamily: "monospace" }}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="dynamic-form--field-container--input dynamic-form--textarea"
              />
            ) : field.type === "text" ? (
              <textarea
                name={field.name}
                value={value}
                placeholder={field.placeholder}
                style={{ height: size }}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="dynamic-form--field-container--input dynamic-form--textarea"
              />
            ) : (
              <input
                type={field.type || "text"}
                name={field.name}
                value={value}
                placeholder={field.placeholder}
                style={{ height: size }}
                min={field.type === "number" ? 0 : undefined}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="dynamic-form--field-container--input"
              />
            )}

          </div>
        );
      })}
    </form>
  );
}

export default DynamicForm;

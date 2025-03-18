// src/components/ui/Card.tsx
import React from "react";

// Define the props that the Card component can accept
interface CardProps {
  children: React.ReactNode; // The content inside the card
  className?: string; // Optional additional CSS classes
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {children}
    </div>
  );
};

// For cards with header, content, and footer sections
interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardSectionProps> = ({
  children,
  className = "",
}) => {
  return <div className={`mb-4 ${className}`}>{children}</div>;
};

export const CardTitle: React.FC<CardSectionProps> = ({
  children,
  className = "",
}) => {
  return (
    <h3 className={`text-lg font-semibold text-gray-700 ${className}`}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<CardSectionProps> = ({
  children,
  className = "",
}) => {
  return <p className={`text-sm text-gray-500 ${className}`}>{children}</p>;
};

export const CardContent: React.FC<CardSectionProps> = ({
  children,
  className = "",
}) => {
  return <div className={className}>{children}</div>;
};

export const CardFooter: React.FC<CardSectionProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

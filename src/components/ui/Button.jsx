import React from 'react';
import './Button.css';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  type = 'button',
  icon: Icon,
  loading = false,
  className = ''
}) => {
  const iconSize = size === 'small' || size === 'sm' ? 16 : size === 'large' || size === 'lg' ? 24 : 20;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`}
    >
      {loading ? (
        <span className="btn-loader"></span>
      ) : (
        <>
          {Icon && <Icon className="btn-icon" size={iconSize} />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default Button;

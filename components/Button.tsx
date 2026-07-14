import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "ghost" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const classes = [styles.btn, styles[variant], className ?? ""].filter(Boolean).join(" ");
  return <button className={classes} {...props} />;
}

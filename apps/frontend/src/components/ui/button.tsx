import * as React from "react";
import { motion, type MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type MotionButtonProps = MotionProps & {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
};

type HTMLButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "ref"
>;

const Button = React.forwardRef<
  HTMLButtonElement,
  MotionButtonProps & HTMLButtonProps
>(({ asChild = false, children, className, ...props }, ref) => {
  const classNames = cn(
    "px-4 py-2 border border-black text-black rounded-md hover:bg-black hover:text-white transition",
    className
  );

  if (asChild && React.isValidElement(children)) {
  const child = children as React.ReactElement<any>;

  // Only add className if child accepts it
  const childProps: any = { ...props };
  if ('className' in child.props) {
    childProps.className = cn(child.props.className, classNames);
  }
  if ('ref' in child.props || typeof ref === 'function' || ref != null) {
    childProps.ref = ref;
  }

  return <motion.span whileTap={{ scale: 0.93 }}>{React.cloneElement(child, childProps)}</motion.span>;
}

  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      className={classNames}
      ref={ref}
      {...props}
    >
      {children}
    </motion.button>
  );
});

Button.displayName = "Button";

export { Button };

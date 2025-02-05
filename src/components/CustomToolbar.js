// CustomToolbar.jsx
'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import composeClasses from '@mui/utils/composeClasses';
import { styled } from '@mui/system'; // Adjusted to use '@mui/system'
import { useDefaultProps } from '../DefaultPropsProvider'; // Ensure correct path
import { getToolbarUtilityClass } from './toolbarClasses'; // Ensure correct path

const useUtilityClasses = (ownerState) => {
  const { classes, disableGutters, variant } = ownerState;

  const slots = {
    root: ['root', !disableGutters && 'gutters', variant],
  };

  return composeClasses(slots, getToolbarUtilityClass, classes);
};

const ToolbarRoot = styled('div', {
  name: 'MuiToolbar',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const { ownerState } = props;

    return [styles.root, !ownerState.disableGutters && styles.gutters, styles[ownerState.variant]];
  },
})(
  ({ theme, ownerState }) => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: ownerState.disableGutters ? 0 : theme.spacing(2),
    paddingRight: ownerState.disableGutters ? 0 : theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      paddingLeft: ownerState.disableGutters ? 0 : theme.spacing(3),
      paddingRight: ownerState.disableGutters ? 0 : theme.spacing(3),
    },
    minHeight: ownerState.variant === 'dense' ? 48 : undefined,
    ...theme.mixins.toolbar, // Applies 'regular' variant styles
  })
);

const CustomToolbar = React.forwardRef(function Toolbar(inProps, ref) {
  const props = inProps; // Simplified for this example
  const {
    className,
    component = 'div',
    disableGutters = false,
    variant = 'regular',
    ...other
  } = props;

  const ownerState = {
    ...props,
    component,
    disableGutters,
    variant,
  };

  const classes = useUtilityClasses(ownerState);

  return (
    <ToolbarRoot
      as={component}
      className={clsx(classes.root, className)}
      ref={ref}
      ownerState={ownerState}
      {...other}
    />
  );
});

CustomToolbar.propTypes = {
  /**
   * The Toolbar children, usually a mixture of `IconButton`, `Button` and `Typography`.
   * The Toolbar is a flex container, allowing flex item properties to be used to lay out the children.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: PropTypes.elementType,
  /**
   * If `true`, disables gutter padding.
   * @default false
   */
  disableGutters: PropTypes.bool,
  /**
   * The variant to use.
   * @default 'regular'
   */
  variant: PropTypes.oneOf(['dense', 'regular']),
};

export default CustomToolbar;

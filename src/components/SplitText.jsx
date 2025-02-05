// src/components/SplitText.jsx
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useIntersection } from 'react-use';

const SplitText = ({
  text,
  className,
  delay = 0,
  animationFrom = { opacity: 0 },
  animationTo = { opacity: 1 },
  easing = 'power3.out',
  threshold = 0.1,
  rootMargin = '0px',
  onLetterAnimationComplete,
}) => {
  const elementRef = useRef(null);
  const intersection = useIntersection(elementRef, {
    threshold,
    rootMargin,
  });

  useEffect(() => {
    if (intersection && intersection.isIntersecting) {
      const chars = elementRef.current.querySelectorAll('.split-char');
      
      gsap.set(chars, animationFrom);
      
      gsap.to(chars, {
        ...animationTo,
        delay,
        ease: easing,
        stagger: 0.02,
        onComplete: onLetterAnimationComplete,
      });
    }
  }, [intersection]);

  return (
    <span ref={elementRef} className={className}>
      {text.split('').map((char, index) => (
        <span key={index} className="split-char" style={{ display: 'inline-block' }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};

export default SplitText;
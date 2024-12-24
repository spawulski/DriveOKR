// frontend/src/components/common/Collapse.jsx
import React, { useRef, useEffect, useState } from 'react';

const Collapse = ({ isOpen, children }) => {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(isOpen ? contentHeight : 0);
    }
  }, [isOpen, children]);

  return (
    <div
      className="transition-all duration-300 ease-in-out"
      style={{ height: height, overflow: 'hidden' }}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

export default Collapse;
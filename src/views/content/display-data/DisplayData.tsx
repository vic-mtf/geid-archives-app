import React, { useMemo } from "react";
import displays from "./displays";
import { useLocation } from "react-router-dom";
// import GridData from './GridData';

export default function DisplayData() {
  const location = useLocation();
  const option = useMemo(
    () => location.state?.navigation?.tabs?.option,
    [location.state?.navigation?.tabs?.option]
  );
  const Display = useMemo(() => displays[option] || React.Fragment, [option]);

  return <Display />;
}

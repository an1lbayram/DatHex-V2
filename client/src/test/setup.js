import '@testing-library/jest-dom';

// jsdom does not implement scrollIntoView; Terminal.jsx calls it to
// auto-scroll to the latest log line.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

export default (string) => {
  const protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/;
  const domainRE = /^[^\s.]+\.\S{2,}$/;
  const match = string.match(protocolAndDomainRE);
  if (!match) {
    return false;
  }
  const everythingAfterProtocol = match[1];
  if (!everythingAfterProtocol) {
    return false;
  }
  if (domainRE.test(everythingAfterProtocol)) {
    return true;
  }
  return false;
};

module.exports = (string) => {
  var protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/;
  var domainRE = /^[^\s.]+\.\S{2,}$/;
  var match = string.match(protocolAndDomainRE);
  if (!match) {
    return false;
  }
  var everythingAfterProtocol = match[1];
  if (!everythingAfterProtocol) {
    return false;
  }
  if (domainRE.test(everythingAfterProtocol)) {
    return true;
  }
  return false;
};

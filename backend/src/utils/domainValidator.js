/**
 * Checks whether an email address belongs to authorized Government / Research domains:
 * @csir.res.in, @*.gov.in, @*.res.in, @nic.in
 */
const isTrustedGovEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const cleanEmail = email.trim().toLowerCase();
  
  // Patterns:
  // 1. @csir.res.in or subdomains like @ncl.res.in, @urdip.res.in
  // 2. @*.gov.in (including @gov.in)
  // 3. @*.res.in (including @res.in)
  // 4. @nic.in or @*.nic.in
  const govRegex = /@([a-zA-Z0-9-]+\.)*(csir\.res\.in|gov\.in|res\.in|nic\.in)$/i;
  return govRegex.test(cleanEmail);
};

module.exports = {
  isTrustedGovEmail,
};

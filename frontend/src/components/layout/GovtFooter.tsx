import React, { useState } from 'react';
import { ShieldCheck, Info, ExternalLink, Phone, Mail, MapPin } from 'lucide-react';

interface PolicyModalData {
  title: string;
  content: string;
}

const POLICIES: Record<string, PolicyModalData> = {
  privacy: {
    title: 'Privacy Policy',
    content:
      'This official portal conforms to the Digital Personal Data Protection Act (DPDPA 2023) and Government of India privacy directives. Personal data (such as trainee credentials, phone numbers, and employee profiles) collected through this system is strictly utilized for official CSIR-HRDC training program management, compliance monitoring, and analytics. No personal information is disclosed, shared, or transferred to any third party without lawful authority.',
  },
  hyperlink: {
    title: 'Hyperlinking Policy',
    content:
      'Prior permission is required before hyperlinks are directed from any website to this portal. Permission for hyperlinks directed to this portal can be obtained by sending an official communication to CSIR-HRDC. We do not permit our pages to be loaded into frames on external sites. The pages of this portal must load into a newly opened browser window of the user.',
  },
  copyright: {
    title: 'Copyright Policy',
    content:
      'The contents of this portal may not be reproduced partially or fully without due permission from CSIR-HRDC. If referred to as part of an official study or publication, the source must be appropriately acknowledged. The material has to be reproduced accurately and not used in a derogatory manner or in a misleading context.',
  },
  terms: {
    title: 'Terms & Conditions',
    content:
      'This portal is designed, developed, and hosted for the Human Resource Development Centre, Council of Scientific & Industrial Research (CSIR), Government of India. Though all efforts have been made to ensure the accuracy and currency of the content on this portal, the same should not be construed as a statement of law or used for any legal purposes.',
  },
  disclaimer: {
    title: 'Disclaimer',
    content:
      'CSIR-HRDC accepts no responsibility in relation to the accuracy, completeness, usefulness or otherwise, of the contents. Users are advised to verify/check any information with relevant official records, gazettes, or authoritative departmental notifications before acting upon it.',
  },
  wim: {
    title: 'Web Information Manager (WIM)',
    content:
      'In accordance with MeitY GIGW 3.0 guidelines, the nominated Web Information Manager (WIM) oversees portal maintenance, content lifecycle, and accessibility compliance.\n\nName: Head, IT & Digital Services Division\nOrganization: CSIR - Human Resource Development Centre\nAddress: Sector 19, Central Govt. Enclave, Kamla Nehru Nagar, Ghaziabad, Uttar Pradesh 201002\nEmail: wim-hrdc@csir.res.in | Phone: +91-120-2785000',
  },
};

const GovtFooter: React.FC = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const lastUpdated = '11 Nov 2026';

  return (
    <footer className="govt-footer" role="contentinfo" aria-label="Official Government Footer">
      {/* Top Footer: Mandatory GIGW 3.0 Navigation & WIM */}
      <div className="govt-footer-main">
        <div className="footer-col about-col">
          <div className="footer-emblem-title">
            <span className="footer-crest" aria-hidden="true">🇮🇳</span>
            <div>
              <div className="footer-title">CSIR - HRDC</div>
              <div className="footer-subtitle">Council of Scientific & Industrial Research</div>
            </div>
          </div>
          <p className="footer-desc">
            Centralized Training Program Management & Analytics Portal.
            Built in compliance with MeitY Guidelines for Indian Government Websites (GIGW 3.0) and CERT-In Cyber Security Standards.
          </p>
        </div>

        <div className="footer-col links-col">
          <div className="footer-heading">Website Policies</div>
          <ul className="footer-link-list">
            <li>
              <button type="button" onClick={() => setActiveModal('privacy')} className="footer-policy-link">
                Privacy Policy
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setActiveModal('hyperlink')} className="footer-policy-link">
                Hyperlinking Policy
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setActiveModal('copyright')} className="footer-policy-link">
                Copyright Policy
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setActiveModal('terms')} className="footer-policy-link">
                Terms & Conditions
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setActiveModal('disclaimer')} className="footer-policy-link">
                Disclaimer
              </button>
            </li>
          </ul>
        </div>

        <div className="footer-col wim-col">
          <div className="footer-heading">Web Information Manager</div>
          <p className="wim-desc">Contact for portal content, accessibility or technical assistance:</p>
          <div className="wim-details">
            <div className="wim-item">
              <Mail size={13} aria-hidden="true" />
              <span>wim-hrdc@csir.res.in</span>
            </div>
            <div className="wim-item">
              <Phone size={13} aria-hidden="true" />
              <span>+91-120-2785000</span>
            </div>
            <div className="wim-item">
              <MapPin size={13} aria-hidden="true" />
              <span>CSIR-HRDC, Ghaziabad, UP - 201002</span>
            </div>
          </div>
          <button type="button" onClick={() => setActiveModal('wim')} className="wim-more-btn">
            View Full WIM Details <ExternalLink size={11} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Compliance Stamp */}
      <div className="govt-footer-bottom">
        <div className="footer-bottom-inner">
          <div className="copyright-text">
            © {new Date().getFullYear()} CSIR - Human Resource Development Centre, Government of India. All Rights Reserved.
          </div>
          <div className="compliance-badges">
            <span className="badge-item">
              <ShieldCheck size={13} style={{ color: '#10b981' }} aria-hidden="true" />
              <span>CERT-In Safe-to-Host Ready</span>
            </span>
            <span className="badge-item">
              <Info size={13} style={{ color: '#3b82f6' }} aria-hidden="true" />
              <span>GIGW 3.0 / WCAG 2.1 AA Compliant</span>
            </span>
            <span className="last-updated">Last Updated: {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Policy Dialog Modal */}
      {activeModal && POLICIES[activeModal] && (
        <div
          className="policy-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="policy-modal-title"
          onClick={() => setActiveModal(null)}
        >
          <div className="policy-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="policy-modal-header">
              <h3 id="policy-modal-title">{POLICIES[activeModal].title}</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setActiveModal(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <div className="policy-modal-body">
              <p style={{ whiteSpace: 'pre-line', lineHeight: 1.6, fontSize: '0.875rem' }}>
                {POLICIES[activeModal].content}
              </p>
            </div>
            <div className="policy-modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setActiveModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default GovtFooter;


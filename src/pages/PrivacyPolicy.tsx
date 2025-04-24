import React from 'react';
import { Box, Typography, Container, Divider, Button, Paper } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 4, color: '#fff' }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)} // Go back to the previous page
        sx={{ mb: 3, color: '#C1FF2F' }}
      >
        Back
      </Button>
      <Paper sx={{ p: 4, backgroundColor: '#1E1E1E', borderRadius: '12px' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Privacy Policy
        </Typography>
        <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
          Effective date: 2025.04.19
        </Typography>

        <Typography paragraph sx={{ color: '#eee' }}>
          Welcome to TeamUp (“we”, “our”, or “us”). Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our web app, available at teamup.lt (the “Service”).
        </Typography>

        <Divider sx={{ my: 3, borderColor: '#444' }} />

        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          1. Information We Collect
        </Typography>
        <Typography variant="h6" component="h3" gutterBottom sx={{ color: '#eee' }}>
          a. Information You Provide:
        </Typography>
        <Typography paragraph sx={{ color: '#eee' }}>
          When you register or use the Service, we collect:
        </Typography>
        <ul style={{ listStylePosition: 'inside', paddingLeft: '20px', color: '#eee' }}>
          <li>Your name and surname</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Favorite sport category</li>
          <li>Profile photo (optional)</li>
        </ul>

        <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 2, color: '#eee' }}>
          b. Automatically Collected Data:
        </Typography>
        <Typography paragraph sx={{ color: '#eee' }}>
          We may collect:
        </Typography>
        <ul style={{ listStylePosition: 'inside', paddingLeft: '20px', color: '#eee' }}>
          <li>Device and browser type</li>
          <li>IP address</li>
          <li>Usage statistics and interaction logs</li>
          <li>Location data (if enabled by the user)</li>
        </ul>

        <Divider sx={{ my: 3, borderColor: '#444' }} />

        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          2. How We Use Your Information
        </Typography>
        <Typography paragraph sx={{ color: '#eee' }}>
          We use your information to:
        </Typography>
        <ul style={{ listStylePosition: 'inside', paddingLeft: '20px', color: '#eee' }}>
          <li>Allow you to create and join sport events</li>
          <li>Help other users discover events and teammates</li>
          <li>Enable profile personalization and badges</li>
          <li>Improve app performance and user experience</li>
          <li>Communicate updates or service changes</li>
        </ul>
        <Typography paragraph sx={{ mt: 1, color: '#eee' }}>
          We do not sell your personal data to third parties.
        </Typography>

        <Divider sx={{ my: 3, borderColor: '#444' }} />

        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          3. Sharing of Information
        </Typography>
        <Typography paragraph sx={{ color: '#eee' }}>
          We may share limited data:
        </Typography>
        <ul style={{ listStylePosition: 'inside', paddingLeft: '20px', color: '#eee' }}>
          <li>With other users (e.g. name, sport, event participation)</li>
          <li>With service providers (e.g. Firebase) for hosting and analytics</li>
          <li>If legally required (e.g. to comply with law enforcement)</li>
        </ul>

        <Divider sx={{ my: 3, borderColor: '#444' }} />

        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          4. Cookies & Tracking
        </Typography>
        <Typography paragraph sx={{ color: '#eee' }}>
          We use cookies and similar technologies for:
        </Typography>
        <ul style={{ listStylePosition: 'inside', paddingLeft: '20px', color: '#eee' }}>
          <li>User authentication</li>
          <li>Analytics (e.g. Google Analytics, Firebase)</li>
          <li>Improving service performance</li>
        </ul>
        <Typography paragraph sx={{ mt: 1, color: '#eee' }}>
          You may disable cookies in your browser settings.
        </Typography>

        <Divider sx={{ my: 3, borderColor: '#444' }} />

        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          5. Data Retention
        </Typography>
        <Typography paragraph sx={{ color: '#eee' }}>
          We retain your data only as long as necessary to:
        </Typography>
        <ul style={{ listStylePosition: 'inside', paddingLeft: '20px', color: '#eee' }}>
          <li>Provide the Service</li>
          <li>Comply with legal obligations</li>
          <li>Resolve disputes and enforce policies</li>
        </ul>

        <Divider sx={{ my: 3, borderColor: '#444' }} />

        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          6. Your Rights
        </Typography>
        <Typography paragraph sx={{ color: '#eee' }}>
          You may:
        </Typography>
        <ul style={{ listStylePosition: 'inside', paddingLeft: '20px', color: '#eee' }}>
          <li>Access, update, or delete your account data</li>
          <li>Request a copy of your data</li>
          <li>Withdraw consent (if applicable)</li>
        </ul>
        <Typography paragraph sx={{ mt: 1, color: '#eee' }}>
          To do this, contact us at hello@teamup.lt.
        </Typography>

        <Divider sx={{ my: 3, borderColor: '#444' }} />

        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          7. Security
        </Typography>
        <Typography paragraph sx={{ color: '#eee' }}>
          We use secure technologies (like HTTPS, Firebase security rules) to protect your data. However, no system is 100% secure.
        </Typography>

        <Divider sx={{ my: 3, borderColor: '#444' }} />

        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          8. Children's Privacy
        </Typography>
        <Typography paragraph sx={{ color: '#eee' }}>
          TeamUp is not intended for use by individuals under the age of 13. We do not knowingly collect data from children.
        </Typography>

        <Divider sx={{ my: 3, borderColor: '#444' }} />

        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          9. Changes to This Policy
        </Typography>
        <Typography paragraph sx={{ color: '#eee' }}>
          We may update this Privacy Policy. We will notify you by updating the “Effective date” above. Continued use of the app after changes means you accept the revised policy.
        </Typography>

        <Divider sx={{ my: 3, borderColor: '#444' }} />

        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          10. Contact Us
        </Typography>
        <Typography paragraph sx={{ color: '#eee' }}>
          If you have any questions or concerns, please contact:
        </Typography>
        <Typography paragraph sx={{ color: '#eee' }}>
          📧 info@teamup.lt
        </Typography>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy; 
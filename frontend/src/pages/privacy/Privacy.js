import React, {useEffect} from "react";
import { useOutletContext } from "react-router-dom";

export default function Privacy() {
  const { projectName } = useOutletContext();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-400 to-sky-500 text-white py-10">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-lg">Last Updated: April 26, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">Introduction</h2>
          
          <p className="mb-4">
            {projectName} ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains 
            how we collect, use, disclose, and safeguard your information when you use our 3D model creation platform.
          </p>
          
          <p className="mb-4">
            Please read this Privacy Policy carefully. By accessing or using our Service, you acknowledge that you have 
            read, understood, and agree to be bound by all the terms of this Privacy Policy.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">1. Information We Collect</h2>
          
          <h3 className="text-xl font-medium mt-4 mb-2">a. Personal Information</h3>
          <p className="mb-4">
            We may collect personal information that you provide to us, such as:
          </p>
          <ul className="list-disc ml-6 mb-4">
            <li className="mb-2">Name and contact information (email address, phone number)</li>
            <li className="mb-2">Account credentials (username, password)</li>
            <li className="mb-2">Payment information (processed through secure third-party payment processors)</li>
            <li className="mb-2">Profile information (profile picture, biographical information)</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-4 mb-2">b. User Content</h3>
          <p className="mb-4">
            When you use our Service, we collect the videos you upload and the 3D models you create, as well as metadata 
            associated with this content.
          </p>
          
          <h3 className="text-xl font-medium mt-4 mb-2">c. Usage Information</h3>
          <p className="mb-4">
            We automatically collect certain information about your interaction with our Service, including:
          </p>
          <ul className="list-disc ml-6 mb-4">
            <li className="mb-2">Log data (IP address, browser type, pages visited, time spent on pages)</li>
            <li className="mb-2">Device information (device type, operating system)</li>
            <li className="mb-2">Usage patterns and preferences</li>
            <li className="mb-2">Performance data related to 3D model processing</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">2. How We Use Your Information</h2>
          
          <p className="mb-4">
            We use the information we collect for various purposes, including:
          </p>
          
          <ul className="list-disc ml-6 mb-4">
            <li className="mb-2">Providing, maintaining, and improving our Service</li>
            <li className="mb-2">Processing your 3D model creation requests</li>
            <li className="mb-2">Managing your account and providing customer support</li>
            <li className="mb-2">Processing transactions and sending related information</li>
            <li className="mb-2">Responding to your comments, questions, and requests</li>
            <li className="mb-2">Sending technical notices, updates, security alerts, and administrative messages</li>
            <li className="mb-2">Personalizing your experience and delivering content relevant to your interests</li>
            <li className="mb-2">Monitoring and analyzing trends, usage, and activities in connection with our Service</li>
            <li className="mb-2">Detecting, investigating, and preventing fraudulent transactions and other illegal activities</li>
            <li className="mb-2">Improving our machine learning and Gaussian splatting algorithms</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">3. How We Share Your Information</h2>
          
          <p className="mb-4">
            We may share your information in the following circumstances:
          </p>
          
          <ul className="list-disc ml-6 mb-4">
            <li className="mb-2">
              <strong>Service Providers:</strong> We may share your information with third-party vendors, consultants, 
              and other service providers who need access to such information to carry out work on our behalf.
            </li>
            <li className="mb-2">
              <strong>Public Content:</strong> Any content that you make public on our Service, including 3D models 
              shared in public galleries, will be available to other users of the Service.
            </li>
            <li className="mb-2">
              <strong>Compliance with Laws:</strong> We may disclose your information where required to comply with 
              applicable laws, regulations, legal processes, or governmental requests.
            </li>
            <li className="mb-2">
              <strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of all or a 
              portion of our assets, your information may be transferred as part of that transaction.
            </li>
            <li className="mb-2">
              <strong>With Your Consent:</strong> We may share your information with third parties when we have your consent to do so.
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">4. Your Rights and Choices</h2>
          
          <p className="mb-4">
            You have several rights regarding your personal information:
          </p>
          
          <ul className="list-disc ml-6 mb-4">
            <li className="mb-2">
              <strong>Account Information:</strong> You can access, update, or delete your account information at any time 
              through your account settings or by contacting us.
            </li>
            <li className="mb-2">
              <strong>User Content:</strong> You can delete your uploaded videos and created 3D models, though some 
              information may remain in our archives and backup systems.
            </li>
            <li className="mb-2">
              <strong>Communication Preferences:</strong> You can opt out of receiving promotional communications by 
              following the instructions in those communications or adjusting your notification settings.
            </li>
            <li className="mb-2">
              <strong>Cookies and Tracking Technologies:</strong> You can set your browser to refuse all or some cookies, 
              though this may affect your ability to use certain features of our Service.
            </li>
            <li className="mb-2">
              <strong>Data Rights:</strong> Depending on your location, you may have additional rights under applicable 
              data protection laws (such as GDPR or CCPA).
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">5. Data Security</h2>
          
          <p className="mb-4">
            We implement reasonable security measures to protect your personal information from unauthorized access, 
            alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic 
            storage is 100% secure, and we cannot guarantee absolute security.
          </p>
          
          <p className="mb-4">
            You are responsible for maintaining the confidentiality of your account credentials and for restricting 
            access to your devices.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">6. Retention of Data</h2>
          
          <p className="mb-4">
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this 
            Privacy Policy, unless a longer retention period is required or permitted by law.
          </p>
          
          <p className="mb-4">
            When determining retention periods, we consider:
          </p>
          
          <ul className="list-disc ml-6 mb-4">
            <li className="mb-2">The amount, nature, and sensitivity of the information</li>
            <li className="mb-2">The potential risk of harm from unauthorized use or disclosure</li>
            <li className="mb-2">The purposes for which we process the information</li>
            <li className="mb-2">Whether we can achieve those purposes through other means</li>
            <li className="mb-2">Applicable legal requirements</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">7. Children's Privacy</h2>
          
          <p className="mb-4">
            Our Service is not directed to children under the age of 13 (or 16 in certain jurisdictions). We do not 
            knowingly collect personal information from children. If you are a parent or guardian and you believe your 
            child has provided us with personal information, please contact us immediately.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">8. International Data Transfers</h2>
          
          <p className="mb-4">
            Your information may be transferred to, and maintained on, computers located outside of your state, province, 
            country, or other governmental jurisdiction where the data protection laws may differ from those in your jurisdiction.
          </p>
          
          <p className="mb-4">
            If you are located outside the United States and choose to provide information to us, please note that we transfer 
            the data to the United States and process it there. Your consent to this Privacy Policy followed by your 
            submission of such information represents your agreement to that transfer.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">9. Cookies and Tracking Technologies</h2>
          
          <p className="mb-4">
            We use cookies and similar tracking technologies to track activity on our Service and hold certain information. 
            Cookies are files with a small amount of data that may include an anonymous unique identifier.
          </p>
          
          <p className="mb-4">
            We use cookies for the following purposes:
          </p>
          
          <ul className="list-disc ml-6 mb-4">
            <li className="mb-2">To maintain your session and preferences</li>
            <li className="mb-2">To authenticate users and prevent fraudulent use</li>
            <li className="mb-2">To analyze usage patterns and improve our Service</li>
            <li className="mb-2">To personalize your experience</li>
          </ul>
          
          <p className="mb-4">
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, 
            if you do not accept cookies, you may not be able to use some portions of our Service.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">10. Third-Party Links and Services</h2>
          
          <p className="mb-4">
            Our Service may contain links to third-party websites, services, or applications that are not operated by us. 
            We have no control over and assume no responsibility for the content, privacy policies, or practices of any 
            third-party sites or services.
          </p>
          
          <p className="mb-4">
            We encourage you to review the privacy policies of any third-party services that you access through our Service.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">11. Changes to This Privacy Policy</h2>
          
          <p className="mb-4">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
            Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.
          </p>
          
          <p className="mb-4">
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy 
            are effective when they are posted on this page.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">12. Contact Us</h2>
          
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          
          <p className="mb-4">
            Email: privacy@{projectName.toLowerCase()}.com<br />
            Address: [Your Company Address]
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-4 px-4 border-t text-sm text-gray-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div>Copyright © 2025 {projectName}</div>
        </div>
      </footer>
    </div>
  );
}
import React, {useEffect} from "react";
import { useOutletContext } from "react-router-dom";

export default function Terms() {
  const { projectName } = useOutletContext();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-400 to-sky-500 text-white py-10">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-lg">Last Updated: April 26, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">Welcome to {projectName}</h2>
          
          <p className="mb-4">
            These Terms of Service ("Terms") govern your access to and use of {projectName}, including our website, 
            mobile applications, and services (collectively, the "Service"). By accessing or using the Service, you agree 
            to be bound by these Terms. If you do not agree to these Terms, please do not use the Service.
          </p>
          
          <p className="mb-4">
            {projectName} is a platform that transforms videos into photorealistic 3D models using Gaussian splatting technology.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">1. Acceptance of Terms</h2>
          
          <p className="mb-4">
            By accessing or using our Service, you confirm that you are at least 18 years old, or that you are at least 13 years old and have parental consent to use the Service.
          </p>
          
          <p className="mb-4">
            We may modify these Terms at any time, and such modifications shall be effective immediately upon posting. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">2. Account Registration</h2>
          
          <p className="mb-4">
            To access certain features of our Service, you may be required to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
          </p>
          
          <p className="mb-4">
            You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">3. User Content</h2>
          
          <p className="mb-4">
            Our Service allows you to upload, submit, store, send, and receive content, including videos, images, and 3D models ("User Content"). You retain all rights to your User Content, but you grant us a non-exclusive, royalty-free, worldwide license to use, reproduce, modify, adapt, publish, translate, and distribute your User Content in connection with the Service.
          </p>
          
          <p className="mb-4">
            You represent and warrant that:
          </p>
          
          <ul className="list-disc ml-6 mb-4">
            <li className="mb-2">You own or have the necessary rights to your User Content and have the right to grant the license described above;</li>
            <li className="mb-2">Your User Content does not violate the privacy rights, publicity rights, intellectual property rights, or any other rights of any person;</li>
            <li className="mb-2">Your User Content does not contain material that is illegal, obscene, defamatory, or otherwise objectionable.</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">4. Service Usage</h2>
          
          <p className="mb-4">
            You agree not to use the Service:
          </p>
          
          <ul className="list-disc ml-6 mb-4">
            <li className="mb-2">In any way that violates any applicable law or regulation;</li>
            <li className="mb-2">To impersonate or attempt to impersonate {projectName}, an employee, another user, or any other person;</li>
            <li className="mb-2">To engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service;</li>
            <li className="mb-2">To attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Service;</li>
            <li className="mb-2">To use the Service to create 3D models of content that you do not have the rights to reproduce;</li>
            <li className="mb-2">To use the Service to develop content for illegal purposes.</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">5. Intellectual Property</h2>
          
          <p className="mb-4">
            The Service and its original content, features, and functionality are owned by {projectName} and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>
          
          <p className="mb-4">
            Our name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of {projectName}. You must not use such marks without our prior written permission.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">6. 3D Models and Licensing</h2>
          
          <p className="mb-4">
            When you create a 3D model using our Service:
          </p>
          
          <ul className="list-disc ml-6 mb-4">
            <li className="mb-2">You retain ownership of the 3D models you create using our Service, subject to the license granted to us;</li>
            <li className="mb-2">You may use the 3D models for personal or commercial purposes, subject to compliance with these Terms;</li>
            <li className="mb-2">If you choose to make your 3D model public on our platform, other users may view and interact with your model as permitted by our Service.</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">7. Subscription and Payment</h2>
          
          <p className="mb-4">
            Some features of our Service may require payment of fees. By selecting a subscription plan or making a purchase:
          </p>
          
          <ul className="list-disc ml-6 mb-4">
            <li className="mb-2">You agree to pay all fees and taxes associated with your subscription or purchase;</li>
            <li className="mb-2">You authorize us to charge your designated payment method;</li>
            <li className="mb-2">Subscriptions will automatically renew unless you cancel before the renewal date;</li>
            <li className="mb-2">Fees are non-refundable unless otherwise required by law or specified in our refund policy.</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">8. Disclaimer of Warranties</h2>
          
          <p className="mb-4">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. 
            WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
            PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          
          <p className="mb-4">
            We do not guarantee that the Service will be uninterrupted, secure, or error-free, or that any defects will be corrected.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">9. Limitation of Liability</h2>
          
          <p className="mb-4">
            IN NO EVENT SHALL {projectName.toUpperCase()} BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR 
            PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, 
            RESULTING FROM YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">10. Termination</h2>
          
          <p className="mb-4">
            We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, 
            for any reason whatsoever, including without limitation if you breach these Terms.
          </p>
          
          <p className="mb-4">
            Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, 
            you may simply discontinue using the Service or contact us to request account deletion.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">11. Governing Law</h2>
          
          <p className="mb-4">
            These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], 
            without regard to its conflict of law provisions.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">12. Changes to Terms</h2>
          
          <p className="mb-4">
            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will 
            provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change 
            will be determined at our sole discretion.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-medium mb-4">13. Contact Us</h2>
          
          <p className="mb-4">
            If you have any questions about these Terms, please contact us at:
          </p>
          
          <p className="mb-4">
            Email: legal@{projectName.toLowerCase()}.com<br />
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
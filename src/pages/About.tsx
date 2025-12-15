import React from 'react';
import { FaAward, FaHandshake, FaLeaf, FaUsers } from 'react-icons/fa';

const About: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 mt-8 text-center">About Parnika Silks</h1>
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Our Story</h2>
          <p className="text-gray-600 mb-6">
            Founded in 2024, Parnika Silks emerged from a passion for bringing India's finest handcrafted silk sarees to customers worldwide. As a new online boutique, we're dedicated to preserving and promoting the rich heritage of Indian silk weaving while making these exquisite pieces accessible to a global audience.
          </p>
          <p className="text-gray-600">
            Though we're just beginning our journey, our commitment to quality, authenticity, and customer satisfaction remains unwavering. We work directly with skilled artisans across India, ensuring that each piece in our collection tells a story of tradition and craftsmanship.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-4">
              <FaAward className="text-pink-600 text-2xl mr-3" />
              <h2 className="text-2xl font-semibold text-gray-700">Excellence in Craftsmanship</h2>
            </div>
            <p className="text-gray-600">
              Each Parnika Silk saree is a masterpiece of precision and artistry. We partner with master weavers who employ time-honored techniques to create pieces that are both beautiful and durable. From the selection of the finest silk threads to the intricate weaving process, every step is executed with meticulous attention to detail.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-4">
              <FaHandshake className="text-pink-600 text-2xl mr-3" />
              <h2 className="text-2xl font-semibold text-gray-700">Ethical Sourcing</h2>
            </div>
            <p className="text-gray-600">
              As a new business, we're building direct relationships with silk farmers and weavers across India, ensuring fair trade practices and sustainable sourcing. Our commitment to ethical business extends beyond transactions – we invest in our artisan communities, providing support and preserving traditional weaving techniques for future generations.
            </p>
          </div>
        </div>

        {/* Collection Highlights */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Our Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Kanjeevaram</h3>
              <p className="text-gray-600">Known for their distinctive temple borders and rich zari work</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Banarasi</h3>
              <p className="text-gray-600">Famous for their intricate brocade patterns and metallic thread work</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Mysore</h3>
              <p className="text-gray-600">Celebrated for their soft texture and subtle geometric designs</p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-4">
              <FaLeaf className="text-pink-600 text-2xl mr-3" />
              <h2 className="text-2xl font-semibold text-gray-700">Sustainability</h2>
            </div>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Eco-friendly dyeing processes</li>
              <li>Minimal packaging and waste reduction</li>
              <li>Support for organic silk farming</li>
              <li>Energy-efficient production methods</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-4">
              <FaUsers className="text-pink-600 text-2xl mr-3" />
              <h2 className="text-2xl font-semibold text-gray-700">Community Impact</h2>
            </div>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Supporting artisan families</li>
              <li>Preserving traditional weaving techniques</li>
              <li>Providing skill development programs</li>
              <li>Creating sustainable employment opportunities</li>
            </ul>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Connect With Us</h2>
          <div className="text-gray-600">
            <p className="mb-4">As an online boutique, we're here to serve you 24/7 through our digital platform.</p>
            <p className="mb-2">Email: parnikasilksofficial@gmail.com</p>
            <p className="mb-4">Phone: +91 9030389516</p>
            <p className="text-sm italic">Experience the magic of handcrafted silk sarees from the comfort of your home.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
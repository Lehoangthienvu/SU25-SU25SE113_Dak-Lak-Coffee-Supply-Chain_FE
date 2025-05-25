import React from 'react';

const Home = () => {
    return (
        <div className="bg-[url('/path-to-your-image.jpg')] bg-cover bg-center min-h-screen flex flex-col items-center">
            <header className="bg-brown-700 bg-opacity-80 text-white text-center py-8 px-4 rounded-lg shadow-lg mt-10 w-11/12 md:w-3/4">
                <h1 className="text-5xl font-extrabold drop-shadow-lg">Welcome to Dak Lak Coffee Supply Chain</h1>
                <p className="text-lg mt-4 font-medium">
                    Experience the finest coffee from the heart of Vietnam.
                </p>
                <button className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all">
                    Explore Now
                </button>
            </header>
            <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 w-11/12 md:w-3/4">
                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
                    <h2 className="text-2xl font-semibold text-brown-700">Our Mission</h2>
                    <p className="text-gray-600 mt-2">
                        To connect coffee farmers with global markets and ensure sustainability.
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
                    <h2 className="text-2xl font-semibold text-brown-700">Our Products</h2>
                    <p className="text-gray-600 mt-2">
                        Explore a variety of high-quality coffee beans and products.
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
                    <h2 className="text-2xl font-semibold text-brown-700">Contact Us</h2>
                    <p className="text-gray-600 mt-2">
                        Reach out to us for partnerships or inquiries.
                    </p>
                </div>
            </section>
            <footer className="mt-10 text-center text-gray-700">
                <p className="text-sm">&copy; 2025 Dak Lak Coffee Supply Chain. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Home;
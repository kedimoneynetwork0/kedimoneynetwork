import React from 'react';

/**
 * ResponsiveDemo Component
 *
 * Demonstrates the comprehensive responsive layout system with:
 * - Responsive containers and grids
 * - Flexible spacing utilities
 * - Responsive typography
 * - Adaptive cards and buttons
 * - Mobile-first design principles
 */
const ResponsiveDemo = () => {
  return (
    <div className="container py-2xl">
      {/* Hero Section */}
      <section className="text-center mb-3xl">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-lg">
          Responsive Layout Demo
        </h1>
        <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto">
          Experience our comprehensive responsive design system that adapts beautifully across all devices.
        </p>
      </section>

      {/* Feature Grid */}
      <section className="mb-3xl">
        <h2 className="text-3xl font-bold text-center mb-xl">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📱 Mobile First</h3>
            </div>
            <div className="card-body">
              <p className="text-secondary">
                Designed with mobile devices as the primary focus, ensuring optimal experience on small screens.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🖥️ Desktop Ready</h3>
            </div>
            <div className="card-body">
              <p className="text-secondary">
                Scales beautifully to large desktop screens with enhanced layouts and spacing.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">⚡ Performance</h3>
            </div>
            <div className="card-body">
              <p className="text-secondary">
                Optimized CSS with modern techniques for fast loading and smooth interactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Form */}
      <section className="mb-3xl">
        <div className="card max-w-2xl mx-auto">
          <div className="card-header">
            <h3 className="card-title text-center">Contact Form</h3>
          </div>
          <div className="card-body">
            <form className="space-y-lg">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  placeholder="Enter your message"
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row gap-md justify-end">
                <button type="button" className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mb-3xl">
        <h2 className="text-3xl font-bold text-center mb-xl">Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-md">
              <div>
                <h3 className="stat-value">1,234</h3>
                <p className="stat-description">Total Users</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
            <div className="stat-change positive">
              <span>↗️</span>
              <span>+12.5%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-md">
              <div>
                <h3 className="stat-value">₹2.5M</h3>
                <p className="stat-description">Revenue</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
            <div className="stat-change positive">
              <span>↗️</span>
              <span>+8.2%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-md">
              <div>
                <h3 className="stat-value">98.5%</h3>
                <p className="stat-description">Uptime</p>
              </div>
              <div className="text-3xl">⚡</div>
            </div>
            <div className="stat-change positive">
              <span>↗️</span>
              <span>+0.1%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Table */}
      <section className="mb-3xl">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Data Table</h3>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>John Doe</td>
                    <td>john@example.com</td>
                    <td><span className="badge badge-success">Active</span></td>
                    <td>
                      <div className="flex gap-sm">
                        <button className="btn btn-primary btn-sm">Edit</button>
                        <button className="btn btn-danger btn-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Jane Smith</td>
                    <td>jane@example.com</td>
                    <td><span className="badge badge-warning">Pending</span></td>
                    <td>
                      <div className="flex gap-sm">
                        <button className="btn btn-primary btn-sm">Edit</button>
                        <button className="btn btn-danger btn-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Bob Johnson</td>
                    <td>bob@example.com</td>
                    <td><span className="badge badge-error">Inactive</span></td>
                    <td>
                      <div className="flex gap-sm">
                        <button className="btn btn-primary btn-sm">Edit</button>
                        <button className="btn btn-danger btn-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Navigation */}
      <section className="mb-3xl">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Navigation Menu</h3>
          </div>
          <div className="card-body">
            <nav className="nav">
              <a href="#" className="nav-link active">Home</a>
              <a href="#" className="nav-link">About</a>
              <a href="#" className="nav-link">Services</a>
              <a href="#" className="nav-link">Contact</a>
            </nav>
          </div>
        </div>
      </section>

      {/* Responsive Images */}
      <section className="mb-3xl">
        <h2 className="text-3xl font-bold text-center mb-xl">Image Gallery</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          <div className="card overflow-hidden">
            <img
              src="https://via.placeholder.com/400x300/22c55e/ffffff?text=Image+1"
              alt="Sample 1"
              className="img-responsive aspect-video object-cover"
            />
            <div className="card-body">
              <h4 className="font-semibold mb-sm">Beautiful Landscape</h4>
              <p className="text-secondary text-sm">Responsive image that adapts to container size.</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <img
              src="https://via.placeholder.com/400x300/3b82f6/ffffff?text=Image+2"
              alt="Sample 2"
              className="img-responsive aspect-video object-cover"
            />
            <div className="card-body">
              <h4 className="font-semibold mb-sm">Urban Scene</h4>
              <p className="text-secondary text-sm">Maintains aspect ratio across all devices.</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <img
              src="https://via.placeholder.com/400x300/8b5cf6/ffffff?text=Image+3"
              alt="Sample 3"
              className="img-responsive aspect-video object-cover"
            />
            <div className="card-body">
              <h4 className="font-semibold mb-sm">Nature Photography</h4>
              <p className="text-secondary text-sm">Optimized for all screen sizes and resolutions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-2xl border-t border-gray-200">
        <p className="text-secondary">
          © 2024 KEDI Business. Built with responsive design principles.
        </p>
      </footer>
    </div>
  );
};

export default ResponsiveDemo;
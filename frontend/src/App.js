import CommunityPage from './pages/CommunityPage';

function App() {
    return (
        <Router>
            <div className="App">
                <Navbar />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/users/:id" element={<UserProfile />} />
                    <Route path="/community" element={<CommunityPage />} />
                    {/* ... other routes ... */}
                </Routes>
            </div>
        </Router>
    );
}

export default App; 
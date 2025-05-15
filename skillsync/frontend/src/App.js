import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import MyProfile from './pages/MyProfile';
import UserProfile from './pages/UserProfile';
import PostList from './pages/posts/PostList';
import PostView from './pages/posts/PostView';
import PostCreate from './pages/posts/PostCreate';
import PostEdit from './pages/posts/PostEdit';
import LearningPlans from './pages/learning/LearningPlans';
import LearningPlanDetail from './pages/learning/LearningPlanDetail';
import Error from './pages/Error';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="community" element={<Community />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="users/:userId" element={<UserProfile />} />
        <Route path="posts" element={<PostList />} />
        <Route path="posts/:id" element={<PostView />} />
        <Route path="posts/create" element={<PostCreate />} />
        <Route path="posts/:id/edit" element={<PostEdit />} />
        <Route path="learning-plans" element={<LearningPlans />} />
        <Route path="learning-plans/:id" element={<LearningPlanDetail />} />
        <Route path="*" element={<Error />} />
      </Route>
    </Routes>
  );
}

export default App; 
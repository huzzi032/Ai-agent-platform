"""Tests for authentication module."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app, get_db
from models.database import Base

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


class TestAuthentication:
    """Test authentication endpoints."""
    
    def test_register_user(self):
        """Test user registration."""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "testpassword123",
                "full_name": "Test User"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"
        assert "id" in data
    
    def test_register_duplicate_user(self):
        """Test registering duplicate user fails."""
        # First registration
        client.post(
            "/api/auth/register",
            json={
                "username": "duplicate",
                "email": "dup@example.com",
                "password": "testpassword123"
            }
        )
        
        # Second registration should fail
        response = client.post(
            "/api/auth/register",
            json={
                "username": "duplicate",
                "email": "dup2@example.com",
                "password": "testpassword123"
            }
        )
        assert response.status_code == 400
    
    def test_login_success(self):
        """Test successful login."""
        # Register first
        client.post(
            "/api/auth/register",
            json={
                "username": "logintest",
                "email": "login@example.com",
                "password": "testpassword123"
            }
        )
        
        # Login
        response = client.post(
            "/api/auth/login",
            data={
                "username": "logintest",
                "password": "testpassword123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_failure(self):
        """Test login with wrong credentials."""
        response = client.post(
            "/api/auth/login",
            data={
                "username": "nonexistent",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
    
    def test_get_current_user(self):
        """Test getting current user info."""
        # Register and login
        client.post(
            "/api/auth/register",
            json={
                "username": "meuser",
                "email": "me@example.com",
                "password": "testpassword123"
            }
        )
        
        login_response = client.post(
            "/api/auth/login",
            data={
                "username": "meuser",
                "password": "testpassword123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Get current user
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "meuser"


class TestAgentEndpoints:
    """Test agent endpoints."""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token."""
        # Register
        client.post(
            "/api/auth/register",
            json={
                "username": "agentuser",
                "email": "agent@example.com",
                "password": "testpassword123"
            }
        )
        
        # Login
        response = client.post(
            "/api/auth/login",
            data={
                "username": "agentuser",
                "password": "testpassword123"
            }
        )
        return response.json()["access_token"]
    
    def test_create_agent(self, auth_token):
        """Test creating an agent."""
        response = client.post(
            "/api/agents",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "Test Agent",
                "agent_type": "chatbot",
                "description": "A test agent"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Agent"
        assert data["agent_type"] == "chatbot"
        assert "id" in data
    
    def test_list_agents(self, auth_token):
        """Test listing agents."""
        # Create an agent first
        client.post(
            "/api/agents",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "List Test Agent",
                "agent_type": "chatbot"
            }
        )
        
        response = client.get(
            "/api/agents",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_get_agent(self, auth_token):
        """Test getting a specific agent."""
        # Create agent
        create_response = client.post(
            "/api/agents",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "Get Test Agent",
                "agent_type": "chatbot"
            }
        )
        agent_id = create_response.json()["id"]
        
        # Get agent
        response = client.get(
            f"/api/agents/{agent_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Get Test Agent"
    
    def test_update_agent(self, auth_token):
        """Test updating an agent."""
        # Create agent
        create_response = client.post(
            "/api/agents",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "Update Test Agent",
                "agent_type": "chatbot"
            }
        )
        agent_id = create_response.json()["id"]
        
        # Update agent
        response = client.put(
            f"/api/agents/{agent_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "Updated Agent Name",
                "description": "Updated description"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Agent Name"
    
    def test_delete_agent(self, auth_token):
        """Test deleting an agent."""
        # Create agent
        create_response = client.post(
            "/api/agents",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "Delete Test Agent",
                "agent_type": "chatbot"
            }
        )
        agent_id = create_response.json()["id"]
        
        # Delete agent
        response = client.delete(
            f"/api/agents/{agent_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        # Verify deletion
        get_response = client.get(
            f"/api/agents/{agent_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert get_response.status_code == 404


class TestHealthEndpoint:
    """Test health check endpoint."""
    
    def test_health_check(self):
        """Test health endpoint returns correct status."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "version" in data
        assert "services" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

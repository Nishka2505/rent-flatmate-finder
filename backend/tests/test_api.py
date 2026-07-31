import uuid


def unique_email():
    return f"testuser_{uuid.uuid4().hex[:8]}@example.com"


# ---------- AUTH TESTS ----------

def test_register_new_owner_succeeds(client):
    response = client.post("/auth/register", json={
        "email": unique_email(),
        "password": "TestPass123!",
        "role": "owner",
    })
    assert response.status_code == 200
    assert response.json()["role"] == "owner"


def test_register_invalid_role_returns_400(client):
    response = client.post("/auth/register", json={
        "email": unique_email(),
        "password": "TestPass123!",
        "role": "landlord",  # not a valid role
    })
    assert response.status_code == 400


def test_register_duplicate_email_returns_400(client):
    email = unique_email()
    payload = {"email": email, "password": "TestPass123!", "role": "tenant"}
    client.post("/auth/register", json=payload)  # first registration
    response = client.post("/auth/register", json=payload)  # duplicate
    assert response.status_code == 400


def test_login_with_correct_credentials_returns_token(client):
    email = unique_email()
    client.post("/auth/register", json={"email": email, "password": "TestPass123!", "role": "tenant"})

    response = client.post("/auth/login", data={"username": email, "password": "TestPass123!"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_with_wrong_password_returns_401(client):
    email = unique_email()
    client.post("/auth/register", json={"email": email, "password": "TestPass123!", "role": "tenant"})

    response = client.post("/auth/login", data={"username": email, "password": "WrongPassword"})
    assert response.status_code == 401


def test_get_me_without_token_returns_401(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def _register_and_login(client, role="owner"):
    """Helper: registers a user and returns an auth header dict."""
    email = unique_email()
    client.post("/auth/register", json={"email": email, "password": "TestPass123!", "role": role})
    login_resp = client.post("/auth/login", data={"username": email, "password": "TestPass123!"})
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_get_me_with_valid_token_returns_user(client):
    headers = _register_and_login(client, role="tenant")
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["role"] == "tenant"


# ---------- ROOMS TESTS ----------

def test_get_listings_without_auth_returns_200(client):
    # get_current_user_optional means this should work even logged out
    response = client.get("/rooms/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_listing_requires_owner_role(client):
    tenant_headers = _register_and_login(client, role="tenant")
    response = client.post("/rooms/", json={
        "location": "Kanpur",
        "rent": 8000,
        "description": "Test listing",
    }, headers=tenant_headers)
    # tenants should not be allowed to create listings
    assert response.status_code == 403


def test_create_listing_without_auth_returns_401(client):
    response = client.post("/rooms/", json={
        "location": "Kanpur",
        "rent": 8000,
        "description": "Test listing",
    })
    assert response.status_code == 401


def test_get_nonexistent_listing_returns_404(client):
    response = client.get("/rooms/999999")
    assert response.status_code == 404


def test_owner_can_view_their_own_listings(client):
    owner_headers = _register_and_login(client, role="owner")
    response = client.get("/rooms/owner/my-listings", headers=owner_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_tenant_cannot_view_owner_listings_endpoint(client):
    tenant_headers = _register_and_login(client, role="tenant")
    response = client.get("/rooms/owner/my-listings", headers=tenant_headers)
    assert response.status_code == 403


def test_respond_to_nonexistent_interest_returns_404(client):
    owner_headers = _register_and_login(client, role="owner")
    response = client.patch("/rooms/interest/999999/respond", json={"status": "accepted"}, headers=owner_headers)
    assert response.status_code == 404
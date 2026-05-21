# Import FastAPI utilities for dependency injection and HTTP error handling
from fastapi import Depends, HTTPException, status

# Import OAuth2 bearer token authentication scheme
from fastapi.security import OAuth2PasswordBearer

# Optional typing support (currently unused in this file)
from typing import Optional

# Import application settings/configuration
from app.core.config import settings

# Import authentication service that handles token validation and user retrieval
from app.services import AuthService

# Import user models
from app.models.user import User, UserInDB


# -------------------------------------------------------------------
# OAuth2 Authentication Scheme
# -------------------------------------------------------------------
# Defines where the client should send the username/password
# to obtain an access token.
#
# Example login endpoint:
# /api/v1/auth/login
#
# FastAPI automatically uses this in Swagger/OpenAPI docs.
# -------------------------------------------------------------------
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login"
)


# -------------------------------------------------------------------
# Authentication Service Instance
# -------------------------------------------------------------------
# This service contains authentication-related business logic
# such as:
# - validating JWT tokens
# - retrieving users from the database
# - checking authentication status
# -------------------------------------------------------------------
auth_service = AuthService()


# -------------------------------------------------------------------
# Get Current Authenticated User
# -------------------------------------------------------------------
# Dependency function that:
# 1. Extracts the Bearer token from the request
# 2. Validates the token
# 3. Retrieves the corresponding user
#
# If the token is invalid or user does not exist,
# it raises a 401 Unauthorized error.
#
# Usage:
# current_user: UserInDB = Depends(get_current_user)
# -------------------------------------------------------------------
async def get_current_user(
    token: str = Depends(oauth2_scheme)
) -> UserInDB:
    """
    Retrieve the currently authenticated user using JWT token.
    """

    # Validate token and fetch user from authentication service
    user = await auth_service.get_current_user(token)

    # If token validation fails or user is not found
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",

            # Tells the client authentication is required
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Return authenticated user object
    return user


# -------------------------------------------------------------------
# Get Current Active User
# -------------------------------------------------------------------
# Dependency function that ensures the authenticated user
# is active/enabled.
#
# This is useful when:
# - users can be disabled
# - suspended accounts should not access protected routes
#
# If user is inactive, it raises a 403 Forbidden error.
#
# Usage:
# current_user: UserInDB = Depends(get_current_active_user)
# -------------------------------------------------------------------
async def get_current_active_user(
    current_user: UserInDB = Depends(get_current_user)
) -> UserInDB:
    """
    Ensure the authenticated user account is active.
    """

    # Check whether the user account is active
    if not current_user.is_active:

        # Raise error if account is disabled/inactive
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )

    # Return active user object
    return current_user
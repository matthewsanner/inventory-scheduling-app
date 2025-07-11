from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsManagerOrStaffReadOnly(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.groups.filter(name='Manager').exists():
            return True  # Managers can do anything

        if request.method in SAFE_METHODS and request.user.groups.filter(name='Staff').exists():
            return True  # Staff can only view (GET, HEAD, OPTIONS)

        return False

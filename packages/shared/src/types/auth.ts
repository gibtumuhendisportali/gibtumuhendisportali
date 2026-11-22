import type {
  CommunityRole,
  UserRole,
  UserType,
  VerificationStatus,
} from "../constants/domain";

export interface CommunityPermission {
  communityId: string;
  communitySlug: string;
  role: CommunityRole;
}

export interface AuthContext {
  userId: string;
  supabaseUserId: string;
  email: string;
  role: UserRole;
  userType: UserType | null;
  verificationStatus: VerificationStatus;
  communityPermissions: CommunityPermission[];
}

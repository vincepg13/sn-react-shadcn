import { GlideUserSchema } from '@kit/types/client-scripts'

/**
 * GlideUser class for interacting with user data client side. An instance of this class will be 
 * provided to client scripts as the global object g_user
 */
export class GlideUser {
  private _isAdmin: boolean
  public firstName: string
  public lastName: string
  public fullName: string
  public userName: string
  public userID: string
  public roles: string[]

  /**
   * Constructs a new GlideUser instance.
   * @param _user The user schema object.
   */
  constructor(_user: GlideUserSchema) {
    this.firstName = _user.firstName
    this.lastName = _user.lastName
    this.userName = _user.userName
    this.userID = _user.userID
    this.fullName = _user.fullName
    this.roles = _user.roles
    this._isAdmin = _user.roles.includes('admin')
  }

  /**
   * Returns the full name of the user.
   * @returns The user's full name.
   */
  getFullName() {
    return this.fullName
  }

  /**
   * Checks if the user has the specified role or is an admin.
   * @param role The role to check.
   * @returns True if the user is an admin or has the specified role.
   */
  hasRole(role: string) {
    return this._isAdmin || this.hasRoleExactly(role)
  }

  /**
   * Checks if the user has the specified role (exact match).
   * @param role The role to check.
   * @returns True if the user has the specified role.
   */
  hasRoleExactly(role: string) {
    return this.roles.includes(role)
  }

  /**
   * Checks if the user has any role from a comma-separated list or is an admin.
   * @param roleList Comma-separated list of roles.
   * @returns True if the user is an admin or has any of the roles in the list.
   */
  hasRoleFromList(roleList: string) {
    const roles = roleList.split(',')
    return this._isAdmin || roles.some(role => this.hasRoleExactly(role))
  }

  /**
   * Checks if the user has any roles assigned.
   * @returns True if the user has one or more roles.
   */
  hasRoles() {
    return this.roles.length > 0
  }

  /**
   * Not supported in React. Warns if called but doesnt stop the script.
   */
  getClientData() {
    console.warn('Parsing client data is not supported in react')
  }

  /**
   * Not supported in React. Warns if called but doesnt stop the script.
   */
  setClientData() {
    console.warn('Setting client data is not supported in react')
  }
}

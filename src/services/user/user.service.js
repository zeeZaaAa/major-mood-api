import User from "../../schemas/user/user.schema.js";
import axios from 'axios';

class UserService {
  async getUserByEmail(email) {
    return await User.findOne({ email });
  }

  async getUserById(id) {
    return await User.findById(id);
  }

  async comparePassword(password) {
    return await User.comparePassword(password);
  }

  async createUser(email, name, googleId) {
    const studentId = email.split("@")[0];

    try {
      const response = await axios.get(
        `https://api.kmitl.ac.th/student-catalog/v1/students/${studentId}`,
        {
          headers: {
            'apikey': process.env.KMITL_API_KEY
          }
        }
      );

      if (!response.data) {
        throw new Error('KMITL API returned an empty profile');
      }

      const { level, faculty_name_en, curriculum_name_en } = response.data;

      const user = new User({
        email,
        name,
        googleId,
        level,
        faculty_name: faculty_name_en,
        curriculum_name: curriculum_name_en
      });

      return await user.save();

    } catch (error) {
      console.error('Registration failed at KMITL verification step:', error.message);

      const details = error.response?.data?.message || error.message;
      throw new Error(`Failed to verify KMITL student record: ${details}`);
    }
  }

  async getBannedUsers({ search, page = 1, limit = 10 }) {
    const query = { role: 'bannedUser' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(parseInt(limit)).sort({ bannedAt: -1 }),
      User.countDocuments(query)
    ]);

    return {
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    };
  }

  async banUser(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { role: 'bannedUser' },
      { returnDocument: 'after' }
    );
    if (!user) throw new Error("User account not found");
    return user;
  }

  async unbanUser(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { role: 'user' },
      { returnDocument: 'after' }
    );
    if (!user) throw new Error("User account not found");
    return user;
  }

}

export default new UserService();
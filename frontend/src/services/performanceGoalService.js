import api from './api';

export const performanceGoalService = {
    async getEmployeeGoals(employeeId, cycleId) {
        const res = await api.get(`/performance/goals/${employeeId}/${cycleId}`);
        return res.data;
    },
    async createGoal(data) {
        const res = await api.post('/performance/goals', data);
        return res.data;
    },
    async updateGoal(id, data) {
        const res = await api.put(`/performance/goals/${id}`, data);
        return res.data;
    },
    async deleteGoal(id) {
        const res = await api.delete(`/performance/goals/${id}`);
        return res.data;
    },
    async getEmployeeReview(employeeId, cycleId) {
        const res = await api.get(`/performance/reviews/${employeeId}/${cycleId}`);
        return res.data;
    },
    async saveReview(data) {
        const res = await api.post('/performance/reviews', data);
        return res.data;
    }
};

const hasPartition = (user, partitionId) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    const parts = Array.isArray(user.partitions) ? user.partitions : [];
    return parts.includes('*') || parts.includes(partitionId);
};

const requirePartition = (partitionId) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (!hasPartition(user, partitionId)) {
            return res.status(403).json({ error: `Missing permission: ${partitionId}` });
        }
        return next();
    };
};

module.exports = {
    hasPartition,
    requirePartition,
};


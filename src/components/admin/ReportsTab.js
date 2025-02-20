import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineConnector from '@mui/lab/TimelineConnector';
import useReportManagement from '../../hooks/useReportManagement';

const ReportsTab = () => {
    const { reports, loading, error, resolveReport } = useReportManagement();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" variant="filled">
                    {error}
                </Alert>
            </Box>
        );
    }

    const handleResolveReport = async (reportId, action) => {
        try {
            await resolveReport(reportId, action);
        } catch (err) {
            // Error handling is done in the hook
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>Recent Reports</Typography>
            <Timeline>
                {reports.map((report) => (
                    <TimelineItem key={report.id}>
                        <TimelineSeparator>
                            <TimelineDot color={report.status === 'pending' ? 'warning' : 'success'} />
                            <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            {new Date(report.timestamp?.toDate()).toLocaleString()}
                                        </Typography>
                                        <Chip 
                                            label={report.status} 
                                            color={report.status === 'pending' ? 'warning' : 'success'}
                                            size="small"
                                        />
                                    </Box>
                                    <Typography variant="body1" gutterBottom>
                                        {report.reportType}: {report.reason}
                                    </Typography>
                                    {report.message && (
                                        <Box sx={{ 
                                            mt: 1, 
                                            p: 2, 
                                            bgcolor: 'background.default',
                                            borderRadius: 1,
                                            border: '1px solid',
                                            borderColor: 'divider'
                                        }}>
                                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                                Reported Content:
                                            </Typography>
                                            <Typography variant="body2">
                                                {report.message.content || report.message.text}
                                            </Typography>
                                            {report.message.error && (
                                                <Typography color="error" variant="caption">
                                                    {report.message.error}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                    {report.status === 'pending' && (
                                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                onClick={() => handleResolveReport(report.id, 'reviewed')}
                                            >
                                                Mark as Reviewed
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleResolveReport(report.id, 'deleted')}
                                            >
                                                Delete Content
                                            </Button>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </TimelineContent>
                    </TimelineItem>
                ))}
                {reports.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="textSecondary">No reports to show</Typography>
                    </Box>
                )}
            </Timeline>
        </Box>
    );
};

export default ReportsTab;
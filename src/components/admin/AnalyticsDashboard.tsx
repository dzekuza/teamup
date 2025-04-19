import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Paper, Grid, Box, CircularProgress } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import { collection, getCountFromServer, getDocs, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  title: string;
  count: number | null;
  icon: React.ReactElement;
  loading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, icon, loading }) => (
  <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', backgroundColor: '#1E1E1E', color: '#fff' }}>
    <Box sx={{ mr: 2, color: '#C1FF2F' }}>{React.cloneElement(icon, { sx: { fontSize: 40 } })}</Box>
    <Box>
      <Typography color="#aaa">{title}</Typography>
      <Typography variant="h4" component="div">
        {loading ? <CircularProgress size={24} color="inherit" /> : count ?? 'N/A'}
      </Typography>
    </Box>
  </Paper>
);

interface UserWithTimestamp {
    id: string;
    createdAt?: Timestamp;
}
interface EventWithTimestamp {
    id: string;
    createdAt?: Timestamp;
}

interface ChartDataPoint {
    date: string;
    userCount?: number;
    eventCount?: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [eventCount, setEventCount] = useState<number | null>(null);
  const [loadingUsersCount, setLoadingUsersCount] = useState(true);
  const [loadingEventsCount, setLoadingEventsCount] = useState(true);
  const [usersChartData, setUsersChartData] = useState<ChartDataPoint[]>([]);
  const [eventsChartData, setEventsChartData] = useState<ChartDataPoint[]>([]);
  const [loadingChartData, setLoadingChartData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const processDataForChart = (
      items: (UserWithTimestamp[] | EventWithTimestamp[]),
      dataKey: 'userCount' | 'eventCount'
  ): ChartDataPoint[] => {
      if (!items || items.length === 0) return [];

      const validItems = items.filter(item => item.createdAt && item.createdAt.toDate);

      validItems.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));

      const chartDataMap = new Map<string, ChartDataPoint>();
      let cumulativeCount = 0;

      validItems.forEach(item => {
          const dateStr = format(item.createdAt!.toDate(), 'yyyy-MM-dd');
          cumulativeCount++;
          chartDataMap.set(dateStr, { date: dateStr, [dataKey]: cumulativeCount });
      });

      const sortedDates = Array.from(chartDataMap.keys()).sort();
      const finalChartData: ChartDataPoint[] = [];
      let lastCount = 0;

      if (sortedDates.length > 0) {
          const startDate = new Date(sortedDates[0]);
          const endDate = new Date(sortedDates[sortedDates.length - 1]);
          let currentDate = startDate;

          while (currentDate <= endDate) {
              const dateStr = format(currentDate, 'yyyy-MM-dd');
              if (chartDataMap.has(dateStr)) {
                  lastCount = chartDataMap.get(dateStr)![dataKey]!;
                  finalChartData.push({ date: dateStr, [dataKey]: lastCount });
              } else {
              }
              currentDate.setDate(currentDate.getDate() + 1);
          }
           const lastMapEntry = chartDataMap.get(sortedDates[sortedDates.length - 1])!;
           if (finalChartData.length === 0 || finalChartData[finalChartData.length - 1].date !== lastMapEntry.date) {
               finalChartData.push(lastMapEntry);
           }
      }

       if (finalChartData.length > 0 && finalChartData[0][dataKey] !== 0) {
           const firstDate = new Date(finalChartData[0].date);
           firstDate.setDate(firstDate.getDate() -1);
           const firstDateStr = format(firstDate, 'yyyy-MM-dd');
           finalChartData.unshift({ date: firstDateStr, [dataKey]: 0 });
       } else if (finalChartData.length === 0 && items.length > 0) {
           const firstItem = validItems[0];
           const itemDate = firstItem.createdAt!.toDate();
           const itemDateStr = format(itemDate, 'yyyy-MM-dd');
           const dayBefore = new Date(itemDate);
           dayBefore.setDate(dayBefore.getDate()-1);
           const dayBeforeStr = format(dayBefore, 'yyyy-MM-dd');
           finalChartData.push({ date: dayBeforeStr, [dataKey]: 0 });
           finalChartData.push({ date: itemDateStr, [dataKey]: 1 });
       }


      return finalChartData;
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoadingUsersCount(true);
      setLoadingEventsCount(true);
      setLoadingChartData(true);
      setError(null);
      let fetchError = false;

      const userCountPromise = getCountFromServer(collection(db, "users"))
          .then(snap => setUserCount(snap.data().count))
          .catch(err => {
              console.error("Error fetching user count:", err);
              setError(prev => prev ? `${prev}, User count failed` : "User count failed");
              fetchError = true;
          })
          .finally(() => setLoadingUsersCount(false));

      const eventCountPromise = getCountFromServer(collection(db, "events"))
          .then(snap => setEventCount(snap.data().count))
          .catch(err => {
              console.error("Error fetching event count:", err);
              setError(prev => prev ? `${prev}, Event count failed` : "Event count failed");
              fetchError = true;
          })
          .finally(() => setLoadingEventsCount(false));

      const usersChartPromise = getDocs(query(collection(db, 'users'), orderBy('createdAt')))
          .then(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserWithTimestamp[])
          .catch(err => {
              console.error("Error fetching users for chart:", err);
              setError(prev => prev ? `${prev}, User chart data failed` : "User chart data failed");
              fetchError = true;
              return [];
          });

      const eventsChartPromise = getDocs(query(collection(db, 'events'), orderBy('createdAt')))
            .then(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EventWithTimestamp[])
            .catch(err => {
                console.error("Error fetching events for chart:", err);
                setError(prev => prev ? `${prev}, Event chart data failed` : "Event chart data failed");
                fetchError = true;
                return [];
            });

        try {
            const [usersData, eventsData] = await Promise.all([usersChartPromise, eventsChartPromise]);
            setUsersChartData(processDataForChart(usersData, 'userCount'));
            setEventsChartData(processDataForChart(eventsData, 'eventCount'));
        } catch (err) {
             console.error("Error processing chart data:", err);
             fetchError = true;
        } finally {
            setLoadingChartData(false);
        }

        await Promise.all([userCountPromise, eventCountPromise]);

      if(fetchError){
        toast.error("Failed to fetch some analytics data.");
      }
    };

    fetchAllData();
  }, []);

  const isLoading = loadingChartData;

  return (
    <Paper sx={{ p: 3, backgroundColor: 'transparent', color: '#fff', boxShadow: 'none' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Analytics Overview
      </Typography>

      {error && (
        <Typography color="error" sx={{ my: 2 }}>
          Error fetching data: {error}
        </Typography>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
           <StatCard title="Total Users" count={userCount} icon={<PeopleIcon />} loading={loadingUsersCount}/>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
           <StatCard title="Total Events" count={eventCount} icon={<EventIcon />} loading={loadingEventsCount}/>
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>Growth Trends</Typography>
      <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
             <Paper sx={{ p: 2, backgroundColor: '#1E1E1E', color: '#fff', height: 300 }}>
                 <Typography variant="subtitle1" sx={{ mb: 1 }}>Cumulative Users</Typography>
                 {isLoading ? (
                      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                          <CircularProgress color="inherit" />
                      </Box>
                  ) : usersChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="85%">
                      <LineChart data={usersChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                          <XAxis dataKey="date" stroke="#aaa" fontSize="0.75rem" />
                          <YAxis stroke="#aaa" allowDecimals={false}/>
                          <RechartsTooltip
                              contentStyle={{ backgroundColor: '#333', border: 'none' }}
                              labelStyle={{ color: '#fff' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '0.8rem' }}/>
                          <Line type="monotone" dataKey="userCount" name="Users" stroke="#C1FF2F" strokeWidth={2} dot={false} activeDot={{ r: 6 }}/>
                      </LineChart>
                    </ResponsiveContainer>
                 ) : (
                     <Typography sx={{ textAlign: 'center', mt: 4, color: '#aaa' }}>No user data available for chart.</Typography>
                 )}
             </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
             <Paper sx={{ p: 2, backgroundColor: '#1E1E1E', color: '#fff', height: 300 }}>
                 <Typography variant="subtitle1" sx={{ mb: 1 }}>Cumulative Events</Typography>
                  {isLoading ? (
                      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                          <CircularProgress color="inherit" />
                      </Box>
                  ) : eventsChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="85%">
                      <LineChart data={eventsChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                          <XAxis dataKey="date" stroke="#aaa" fontSize="0.75rem" />
                          <YAxis stroke="#aaa" allowDecimals={false} />
                          <RechartsTooltip
                               contentStyle={{ backgroundColor: '#333', border: 'none' }}
                               labelStyle={{ color: '#fff' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '0.8rem' }}/>
                          <Line type="monotone" dataKey="eventCount" name="Events" stroke="#8884d8" strokeWidth={2} dot={false} activeDot={{ r: 6 }}/>
                      </LineChart>
                    </ResponsiveContainer>
                 ) : (
                     <Typography sx={{ textAlign: 'center', mt: 4, color: '#aaa' }}>No event data available for chart.</Typography>
                 )}
             </Paper>
          </Grid>
      </Grid>

    </Paper>
  );
};

export default AnalyticsDashboard; 
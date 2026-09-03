import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionsApi, BillingOverview } from "@/api/subscriptions-api";
import { useSchoolContext } from "./use-school-context";
import { toast } from "sonner";

export function useBillingOverview() {
  const { schoolId } = useSchoolContext();

  return useQuery({
    queryKey: ["billing-overview", schoolId],
    queryFn: async () => {
      const response = await subscriptionsApi.getOverview();
      return response.data.data as BillingOverview;
    },
    enabled: !!schoolId,
  });
}

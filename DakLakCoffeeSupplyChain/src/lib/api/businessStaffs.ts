const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/BusinessStaffs`;

// ✅ Interface dùng đúng key theo JSON trả về
export interface BusinessStaffListDto {
  staffId: string;
  staffCode: string;
  fullName: string;
  email: string;
  position: string;
  department: string;
}

export async function getAllBusinessStaffs(): Promise<BusinessStaffListDto[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(BASE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await res.json();
  return Array.isArray(result) ? result : result.data || []; // hỗ trợ cả 2 dạng
}

export async function getBusinessStaffById(id: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await res.json();
}

export async function createBusinessStaff(data: any) {
  const token = localStorage.getItem("token");

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    const json = await res.json();
    return {
      status: res.status,
      ...json,
    };
  }

  const text = await res.text();
  return {
    status: res.status,
    message: text,
  };
}

export async function updateBusinessStaff(data: any) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/${data.staffId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    const json = await res.json();
    return {
      status: res.status,
      ...json,
    };
  }

  const text = await res.text();
  return {
    status: res.status,
    message: text,
  };
}

export async function softDeleteBusinessStaff(id: string) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/soft-delete/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    const json = await res.json();
    return {
      status: res.status,
      ...json,
    };
  }

  const text = await res.text();
  return {
    status: res.status,
    message: text,
  };
}

export async function hardDeleteBusinessStaff(id: string) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    const json = await res.json();
    return {
      status: res.status,
      ...json,
    };
  }

  const text = await res.text();
  return {
    status: res.status,
    message: text,
  };
}
